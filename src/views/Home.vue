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
      <!-- <div class="chat-header" v-if="currFriend">
        <h1>{{ currFriend.username }}</h1>
        <p class="typing op">typing...</p>
      </div> -->
    </header>
    <main class="main-section">
      <div class="chat__sidebar">
        <chatList
          :title="mode"
          :filter="filter"
          :friends="mode === 'friends' ? friends : searchResults"
          @open="openChat"
          :currentChat="currChat"
        />
      </div>
      <div class="main-chat">
        <div class="active-chat" v-if="currFriend">
          <header class="chat-header">
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
            <div>
              <h1>{{ currFriend.username }}</h1>
              <p class="typing op">typing...</p>
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
  notifyMe
} from "@/common";
import { mapGetters, mapActions, mapMutations } from "vuex";
import io from "socket.io-client";

export default Vue.extend({
  name: "home",
  mounted() {},
  data() {
    return {
      mode: "friends",
      profileImageOpen: false,
      modalData: { openProfile: false, visibleProfile: {} },
      messages: Object({}),
      currentChat: "",
      currentMessages: [],
      searchResults: [],
      highlightedMessageId: null,
      socket: null,
      typing: {},
      unreadIndex: {}
    };
  },
  methods: {
    ...mapActions(["setFriends"]),
    ...mapMutations(["updateLastMessage", "hideTyping", "showTyping"]),
    viewMore() {
      /** get the next 100 message from the chat history
       * starting with the timestamp of our latest message
       * (which will be the first in the messages array)and going backward
       */
      getMessagePage(
        this.currentChat,
        100,
        this.messages[this.currentChat][0].createdAt
      ).then(({ data }) => {
        /**
         * spread data first and then the current message as data will be our older messages
         * it needs to always come first
         * @todo - I need to account for instances where we will get the messages that have the same timestamp
         * as the timestamp used to create this page 3rd param of getMessagePage call
         */
        this.messages[this.currentChat].unshift(...data);
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
        lastMessage: message
      });
      // TODO: FIXME: implement sort and search algorith for messages or get data from the sub component
      // massive performance issue
      for (const chatMessage of this.messages[this.currentChat]) {
        if (chatMessage._id === message.hID) {
          quoted = chatMessage;
          break;
        }
      }
      /** index for the most recent message */
      let index =
        this.messages[this.currChat].push({
          ...message,
          quoted
        }) - 1;
      this.unreadIndex[this.currChat].push({
        ...message,
        orderedIndex: index
      });
      this.currentMessages = this.messages[this.currChat];
      /** send message to the server via the socket */
      this.socket.emit(
        "sendMessage",
        {
          friendship_id: this.currentChat,
          text: message.text,
          hID: message.hID
        },
        (err, data) => {
          if (err) {
            console.log();
          }

          this.messages[this.currChat][index]._id = data;
          this.messages[this.currChat][index].status = "sent";
        }
      );
    },
    handleTyping(e) {
      var friendship_id = this.currentChat;
      /** if we're not already recorded as "typing" */
      if (!this.typing.status) {
        this.socket.emit(
          "sendMessage",
          {
            friendship_id,
            from: getCookie("username"),
            type: "typing",
            status: "start"
          },
          () => console.log("typing sent")
        );
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
            this.socket.emit(
              "sendMessage",
              { friendship_id, type: "typing", status: "stop" },
              () => console.log("typing sent")
            );
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
      console.log(friendship_id);

      if (!this.messages[friendship_id]) {
        return getMessages(friendship_id).then(({ data, unreadIndex }) => {
          console.log(`setting unread index ${friendship_id}`);
          this.unreadIndex[friendship_id] = unreadIndex;
          this.messages[friendship_id] = data;
          this.currentMessages = this.messages[friendship_id];
          this.currentChat = friendship_id;
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
        console.log(`else ${friendship_id}`);
        this.currentMessages = this.messages[friendship_id];
        this.currentChat = friendship_id;
      }
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
    if (!this.initFriends) {
      this.setFriends().then(() => {
        if (this.friends.length > 0) {
          this.openChat(this.friends[0]._id);
        }
        /** this is written multiple times here for different scenarios
         * find a more efficient way to do this this is all needed because
         * in order to connect to all friends "checkin" we need friends to
         * exist but we also need the socket to be connected
         * UPDATE: i think i only need the friends foreach in here, everything else can be done outside
         */
        this.socket = io(baseURI);
        /**  @todo : will this run several times for connection drops? */
        this.socket.on("connect", () => {
          /**
           * @function checkin
           * @todo add a kind of a queue to the DB (or from another service) so that we can get messages from that queue, for disconnects or so
           * @todo chat page specific logic for getting frienship ID should really use this to determine if to allow functionality on the page
           * @memberof AuthChat
           */
          this.friends.forEach((friend, index) => {
            if (index === 0) {
              // we dont want to mess with the first one because this will be done in the openChat call
              return;
            }
            let friendship_id = friend._id;
            getMessages(friendship_id, 10).then(({ data, unreadIndex }) => {
              console.log(`setting unread index ${friendship_id}`);
              this.unreadIndex[friendship_id] = unreadIndex;
              this.messages[friendship_id] = data;
              this.socket.emit("checkin", {
                friendship_id: friendship_id,
                token: getCookie("token")
              });
            });
          });
        });
        this.socket.on("newMessage", data => {
          /** if its us then do nothing, we already displayed it on the screen */
          /**
           * @todo - check to see if the message has already been displayed to the screen
           * instead of just checking if it was us and then
           * decide if to display it, this can help with using multiple places at once
           */
          if (data.from === getCookie("username")) {
            return;
          }
          /** if we get a message about the other persons typing */
          if (data.type === "typing") {
            // if its saying the person has started typing
            if (data.status === "start") {
              this.showTyping(data.friendship_id);
              if (data.friendship_id === this.currChat) {
                document.querySelector(".typing").classList.remove("op");
              }
              // if its saying the person has stopped typing
            } else if (data.status === "stop") {
              this.hideTyping(data.friendship_id);
              if (data.friendship_id === this.currChat) {
                document.querySelector(".typing").classList.add("op");
              }
            }
            return;
          }
          // send desktop notification
          notifyMe({ from: data.from, message: data.text });
          console.log(data);
          this.messages[data.friendship_id].push({
            createdAt: data.createdAt,
            from: data.from,
            text: data.text,
            _id: data.Ids[0]
          });
          this.updateLastMessage({
            friendship_id: data.friendship_id,
            lastMessage: data
          });
          /** let the next user know that this message is green ticked */
          this.socket.emit(
            "gotMessage",
            {
              friendship_id: data.friendship_id,
              token: getCookie("token"),
              Ids: data.Ids
            },
            () => console.log("message ticked")
          );
        });
        this.socket.on("received", data => {
          data.Ids.forEach(Id => {
            this.unreadIndex[data.friendship_id].forEach(function(msg) {
              if (msg._id === Id) {
                this.messages[data.friendship_id][msg.ordderedIndex].status =
                  "received";
              }
            });
            let message = document.getElementById(Id);
            if (message) {
              message.classList.remove("pending");
              message.classList.remove("sent");
              message.classList.add("received");
            }
          });
        });
        this.socket.on("disconnect", data => {
          console.log("disconnected");
        });
        this.socket.on("sweep", ({ range, friendship_id }) => {
          // mark all the indexes within this range as read
          this.unreadIndex[friendship_id].forEach((message, index) => {
            if (
              message.createdAt <= range[0] &&
              message.createdAt >= range[1]
            ) {
              this.messages[friendship_id][message.orderedIndex].status =
                "received";
              let messageNode = document.getElementById(message._id);
              if (messageNode) {
                messageNode.classList.remove("pending");
                messageNode.classList.remove("sent");
                messageNode.classList.add("received");
              }
            }
            // delete the unused element but how will that affect the foreach loop
          });
        });
      });
    } else {
      this.socket = io(baseURI);
      /**  @todo : will this run several times for connection drops? */
      this.socket.on("connect", () => {
        /**
         * @function checkin
         * @todo add a kind of a queue to the DB (or from another service) so that we can get messages from that queue, for disconnects or so
         * @todo chat page specific logic for getting frienship ID should really use this to determine if to allow functionality on the page
         * @memberof AuthChat
         */
        this.socket.emit(
          "checkin",
          /** @fixme : THIS SHOULD BE THE FRIENDSHIP ID OF THE FRIEND WE ARE CURRENTLY CHATTING WITH */
          { friendship_id: this.currChat, token: getCookie("token") },
          (err, data) =>
            !err
              ? console.log("checkin successful")
              : console.log("checkin unsuccessful")
        );
      });
      this.socket.on("newMessage", data => {
        /** if its us then do nothing, we already displayed it on the screen */
        /**
         * @todo - check to see if the message has already been displayed to the screen and then
         * decide if to display it, this can help with using multiple places at once
         */
        if (data.from === getCookie("username")) {
          return;
        }
        /** if we get a message about the other persons typing */
        if (data.type === "typing") {
          // if its saying the person has started typing
          if (data.status === "start") {
            this.showTyping(data.friendship_id);
            if (data.friendship_id === this.currChat) {
              document.querySelector(".typing").classList.remove("op");
            }
            // if its saying the person has stopped typing
          } else if (data.status === "stop") {
            this.hideTyping(data.friendship_id);
            if (data.friendship_id === this.currChat) {
              document.querySelector(".typing").classList.add("op");
            }
          }
          return;
        }
        // send desktop notification
        notifyMe({ from: data.from, message: data.text });
        this.messages[data.friendship_id].push(data);
        this.updateLastMessage({
          friendship_id: data.friendship_id,
          lastMessage: data
        });
        /** let the next user know that this message is green ticked */
        this.socket.emit(
          "gotMessage",
          {
            friendship_id: data.friendship_id,
            token: getCookie("token"),
            Ids: data.Ids
          },
          () => console.log("message ticked")
        );
      });
      this.socket.on("received", data => {
        data.forEach(Id => {
          let message = document.getElementById(Id);
          if (message) {
            message.classList.remove("pending");
            message.classList.remove("sent");
            message.classList.add("received");
          }
        });
      });
      this.socket.on("disconnect", data => {
        console.log("disconnected");
      });
      this.socket.on("sweep", ({ range, friendship_id }) => {
        // mark all the indexes within this range as read
        this.unreadIndex[friendship_id].forEach((message, index) => {
          if (message.createdAt <= range[0] && message.createdAt >= range[1]) {
            this.messages[friendship_id][message.orderedIndex].status =
              "received";
            let messageNode = document.getElementById(message._id);
            if (messageNode) {
              messageNode.classList.remove("pending");
              messageNode.classList.remove("sent");
              messageNode.classList.add("received");
            }
          }
          // delete the unused element but how will that affect the foreach loop
        });
      });
    }
  },
  computed: {
    ...mapGetters(["friends"]),
    currChat(): string {
      return this.currentChat;
    },
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
  height: 100%;
  display: flex;
  flex-wrap: wrap;
}
.main-chat {
  width: calc(100vw - 350px);
}

.active-chat {
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
  height: 50px;
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
  h1 {
    text-transform: uppercase;
    font-weight: bold;
  }
}
.op {
  opacity: 0;
}
</style>
