<template>
  <div class="home">
    <modal
      :showModal="modalData.openProfile"
      @close="modalData.openProfile = false"
    >
      <template v-slot:full-replace>
        <profile :readonly="true" :displayData="modalData.visibleProfile" />
      </template>
    </modal>
    <header class="main-header">
      <span> options</span>
      <button class="mybt" @click="mode = 'friends'">friends</button>
      <button class="mybt" @click="mode = 'search'">search</button>
      <button class="mybt" @click="() => $router.push('/profile')">
        profile
      </button>
      <button class="mybt" @click="logout">
        logout
      </button>
      <!-- <div class="chat-header" v-if="currFriend">
        <h1>{{ currFriend.username }}</h1>
        <p class="typing op">typing...</p>
      </div> -->
    </header>
    <main class="main-section">
      <div
        :class="{
          chat__sidebar: true,
          active: view === 'chatlist',
          hidden: view !== 'chatlist'
        }"
      >
        <chatList
          :title="mode"
          :filter="filter"
          :friends="mode === 'friends' ? friends : searchResults"
          @open="openChat"
          :currentChat="currChat"
        />
      </div>
      <div
        :class="{
          'main-chat': true,
          active: view === 'chatbody',
          hidden: view !== 'chatbody'
        }"
      >
        <div class="active-chat" v-if="currFriend">
          <header class="chat-header">
            <button class="chatBack" @click="view = 'chatlist'">back</button>
            <div class="chat-header__info-display">
              <img
                @click="profileImageOpen = !profileImageOpen"
                :class="{
                  'chat-header__profile-img': true,
                  'chat-header__profile-img--open': profileImageOpen
                }"
                v-if="!currFriend.imgUrl"
                src="../assets/abstract-user-flat-1.svg"
                alt=""
              />
              <img
                @click="profileImageOpen = !profileImageOpen"
                :class="{
                  'chat-header__profile-img': true,
                  'chat-header__profile-img--open': profileImageOpen
                }"
                v-if="currFriend.imgUrl"
                :src="currFriend.imgUrl"
                alt=""
              />
              <h1>{{ currFriend.username }}</h1>
            </div>
          </header>
          <chatBody
            ref="chatBody"
            :key="currChat"
            :friendship_id="currChat"
            :messages="currMessages"
            :highlighted="highlightedMessageId"
            @replyClick="replyHandler"
            @viewMore="viewMore"
            class="chatBody"
            msg="Welcome to Your Vue.js + TypeScript App"
          />
          <div class="lds-ellipsis typing op">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <chat-text
            :highlighted="highlightedMessageId"
            @newMessage="handleNewMessage"
            @cancelReply="cancelReply"
            @typing="handleTyping"
          ></chat-text>
        </div>
        <div class="empty-chat" v-if="!currFriend">
          Open a chat
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import chatList from "@/components/chatList.vue";
import chatText from "@/components/chatText.vue";
import chatBody from "@/components/chatBody.vue";
import modal from "@/components/modal.vue";
/** using profile view as a component... hmmm */
import profile from "@/views/Profile.vue";
import {
  getFriends,
  getCookie,
  getMessages,
  getMessagePage,
  getLastMessage,
  getUsers,
  baseURI,
  notifyMe,
  logout
} from "@/common";
import { mapGetters, mapActions, mapMutations } from "vuex";
import io from "socket.io-client";

export default Vue.extend({
  name: "home",
  mounted() {},
  data() {
    return {
      view: "chatlist",
      mode: "friends",
      profileImageOpen: false,
      modalData: { openProfile: false, visibleProfile: {} },
      currentChat: "",
      currentMessages: [],
      searchResults: [],
      highlightedMessageId: null,
      typing: {}
    };
  },
  methods: {
    ...mapActions(["setFriends", "setUpApp", "loadMessages", "emitEvent"]),
    ...mapMutations([
      "updateLastMessage",
      "hideTyping",
      "showTyping",
      "addGroupToChatSart",
      "appendMessageToChat",
      "updateSentMessage",
      "pushToUnreadIndex",
      "updateReceivedMessage",
      "setCurrentChat"
    ]),
    logout() {
      logout()
        .then(data => this.$router.push("/login"))
        .catch(() => alert("error logging out, please try again!"));
    },
    viewMore() {
      /** get the next 100 message from the chat history
       * starting with the timestamp of our latest message
       * (which will be the first in the messages array)and going backward
       */
      getMessagePage(
        this.currChat,
        100,
        this.messages[this.currChat][0].createdAt
      ).then(({ data }) => {
        /**
         * @todo - I need to account for instances where we will get the messages that have the same timestamp
         * as the timestamp used to create this page 3rd param of getMessagePage call
         */
        this.addGroupToChatSart({
          friendship_id: this.currChat,
          messages: data
        });
      });
    },
    handleNewMessage(message) {
      if (!message) {
        return;
      }
      this.cancelReply();
      let quoted;
      /** use for the preview message in the list of chats shown in the side tab */
      this.updateLastMessage({
        friendship_id: this.currChat,
        /** we let the server append the id but we need it right now in lastmessage */
        lastMessage: { fromId: this.user.id, ...message }
      });
      // TODO: FIXME: implement sort and search algorith for messages or get data from the sub component
      // massive performance issue
      for (const chatMessage of this.messages[this.currChat]) {
        if (chatMessage._id === message.hID) {
          quoted = chatMessage;
          break;
        }
      }
      this.appendMessageToChat({
        friendship_id: this.currChat,
        message: { ...message, quoted, fromId: this.user.id }
      });
      let index = this.messages[this.currChat].length - 1;

      this.pushToUnreadIndex({
        friendship_id: this.currChat,
        data: { ...message, orderedIndex: index }
      });
      let indexInUnread = this.unreadIndex[this.currChat].length - 1;

      this.emitEvent({
        eventName: "sendMessage",
        data: {
          friendship_id: this.currChat,
          text: message.text,
          hID: message.hID
        }
      })
        .then(data => {
          this.updateSentMessage({
            friendship_id: this.currChat,
            index,
            id: data,
            indexInUnread
          });
          // this.unreadIndex[this.currChat][indexInUnread].status = "sent";
        })
        .catch(err => {
          if (err) {
            console.log("error sending message", err);
          }
        });
    },
    handleTyping(e) {
      var friendship_id = this.currChat;
      /** if we're not already recorded as "typing" */
      if (!this.typing.status) {
        this.emitEvent({
          eventName: "sendMessage",
          data: {
            friendship_id,
            type: "typing",
            status: "start"
          }
        })
          .then(() => console.log("typing sent"))
          .catch(() => console.log("error sending typing"));
        this.typing.status = true;
      }
      /** set a timeout of 1 second every time we press a key */
      this.typing.time = 1000;
      /**
       * if we dont have and interval currently "decrementing" the "counter(typing.time)"
       * then start this interval
       * */
      if (!this.typing.interval) {
        this.typing.interval = setInterval(() => {
          /** every 100 miliseconds we decrement by 100 */
          this.typing.time -= 100;
          // if we've reached 0 seconds
          if (this.typing.time < 0) {
            // mark us as not typing and and clear and delete the interval
            this.typing.status = false;
            clearInterval(this.typing.interval);
            delete this.typing.interval;
            // let the others know that we've stopped typing
            this.emitEvent({
              eventName: "sendMessage",
              data: {
                friendship_id,
                type: "typing",
                status: "stop"
              }
            })
              .then(() => console.log("typing stopped"))
              .catch(() => console.log("error stopping typing"));
          }
        }, 100);
      }
    },
    openChat(friend) {
      let friendship_id = friend._id;
      if (this.mode === "search") {
        this.modalData.visibleProfile = friend;
        this.modalData.openProfile = true;
        return;
      }

      /** if we get this far and dont have any messages, will we ever?
       * maybe just use the socket here directly to make absolutely surethat we dont have any
       */
      if (!this.messages[friendship_id]) {
        return this.loadMessages({ friendship_id }).then(() => {
          /**
           * @todo this is a bit disconnected, we set the current messages using the
           * argument, but then we set the currentMessages variable after
           */
          this.currentMessages = this.messages[friendship_id];
          this.setCurrentChat(friendship_id);
          this.socket.emit(
            "checkin",
            // FIXME: THIS SHOULD BE THE FRIENDSHIP ID OF THE FRIEND WE ARE CURRENTLY CHATTING WITH
            { friendship_id: this.currChat, token: getCookie("token") },
            (err, data) =>
              !err
                ? console.log("checking successful")
                : console.log("checking unsuccessful")
          );
        });
      } else {
        this.currentMessages = this.messages[friendship_id];
        this.setCurrentChat(friendship_id);
      }
      this.view = "chatbody";
    },
    filter(filterString: string) {
      getUsers(filterString).then(({ data }) => {
        this.searchResults = data;
      });
    },
    replyHandler(msgId) {
      this.highlightedMessageId = msgId;
    },
    /**
     * @function cancelReply
     * @description cancels the act of replying to a certain message (sets the property which then alerts sub-conponents)
     */
    cancelReply() {
      this.highlightedMessageId = null;
    }
  },
  created() {
    setTimeout(() => {
      console.log(this.socket);
    }, 5000);
    // this.setUpApp();
  },
  computed: {
    ...mapGetters([
      "friends",
      "user",
      "messages",
      "unreadIndex",
      "socket",
      "currChat"
    ]),
    currMessages() {
      return this.currentMessages;
    },
    currFriend() {
      if (this.friends) {
        return this.friends.find(friend => friend._id === this.currChat);
      }
      return false;
    }
  },
  components: {
    chatBody,
    chatList,
    chatText,
    modal,
    profile
  }
});
</script>
<style lang="scss" scoped>
// TYPING INDICATOR
.lds-ellipsis {
  display: inline-block;
  width: 80px;
  height: 20px;
  position: absolute;
  bottom: 66px;
  left: 10px;
}
.lds-ellipsis div {
  position: absolute;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
  opacity: 0.9;
  background: #646464;
  animation-timing-function: cubic-bezier(0, 1, 1, 0);
}
.lds-ellipsis div:nth-child(1) {
  left: 8px;
  animation: lds-ellipsis1 0.6s infinite;
}
.lds-ellipsis div:nth-child(2) {
  left: 8px;
  animation: lds-ellipsis2 0.6s infinite;
}
.lds-ellipsis div:nth-child(3) {
  left: 32px;
  animation: lds-ellipsis2 0.6s infinite;
}
.lds-ellipsis div:nth-child(4) {
  left: 56px;
  animation: lds-ellipsis3 0.6s infinite;
}
@keyframes lds-ellipsis1 {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes lds-ellipsis3 {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}
@keyframes lds-ellipsis2 {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(24px, 0);
  }
}
// END TYPING INDOCATOR
@keyframes bigup {
  0% {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    z-index: 99999;
  }
  50% {
    width: unset;
    height: 90%;
  }
  75% {
    border-radius: 0px;
  }
  100% {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    z-index: 99999;
    width: unset;
    height: 90%;
    border-radius: 0px;
  }
}

.chat__sidebar {
  width: 350px;
  min-width: 350px;
  height: 100%;
}

.chatList {
  height: 100%;
}
.home {
  --main-header-height: 50px;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
}
.main-chat {
  width: calc(100vw - 350px);
}

.active-chat {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.empty-chat {
  font-size: 30px;
  font-weight: bold;
  text-align: center;
}

.chatBody {
  flex-grow: 1;
}

.main-header {
  // width: 100%;
  flex-grow: 1;
  height: var(--main-header-height);
}

.main-section {
  display: flex;
  height: calc(100vh - 50px);
}

.chat-header {
  display: flex;
  background: linear-gradient(
    89.81deg,
    rgb(0, 93, 64) 0.03%,
    rgb(58, 97, 54) 64.36%
  );
  color: white;
  text-align: center;
  padding: 15px;

  &__profile-img {
    cursor: pointer;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-right: 16px;

    &--open {
      animation: bigup 0.5s ease forwards;
    }
  }
  &__info-display {
    display: flex;
    align-items: center;
    flex-grow: 1;
  }
  h1 {
    text-transform: uppercase;
    font-weight: bold;
  }
}

.typing {
  text-align: left;
}
.op {
  opacity: 0;
}
.chatBack {
  display: none;
}

@media (max-width: 768px) {
  .main-section {
    flex-direction: column;
  }
  .hidden {
    display: none;
  }
  .active {
    width: 100vw;
  }
  .active-chat {
    height: calc(100vh - var(--main-header-height));
  }
  .chatBack {
    display: block;
    color: white;
    font-weight: bold;
    background-color: transparent;
    border: none;
    padding: 0px 8px;
    cursor: pointer;
  }
  .chat-header h1 {
    font-size: 20px;
  }
  .chat-header__profile-img {
    height: 40px;
    width: 40px;
  }
  .chat-header__info-display {
    justify-content: center;
  }
}
</style>
