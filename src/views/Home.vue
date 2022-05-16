<template>
  <div class="home">
    <div id="sound"></div>
    <sideMenu
      @close="sideMenuActive = false"
      :active="sideMenuActive"
      :menuData="sideMenuData"
    >
    </sideMenu>
    <newModal
      :showModal="modalData.openProfile"
      @close="modalData.openProfile = false"
    >
      <template v-slot:full-replace>
        <new-profile :details="modalData.visibleProfile" />
      </template>
    </newModal>
    <newModal :showModal="sharedImage !== null" @close="clearSharedImage()">
      <template v-slot:full-replace>
        <img :src="sharedImage && sharedImage.url" style="width: 100%" />
        <chatList
          title="Chat"
          :userList="friendShips"
          :currentChat="currChatFriendshipId"
          @open="({ _id }) => $router.push('/home?chat=' + _id)"
        />
      </template>
    </newModal>
    <main class="main-section">
      <div
        :class="{
          chat__sidebar: true,
          active: homeView === 'chatlist',
          hidden: homeView !== 'chatlist'
        }"
      >
        <header
          :class="{
            'main-header': true,
            offline: !network,
            reconnecting: !socketConnected
          }"
        >
          <button class="btn" @click="sideMenuActive = !sideMenuActive">
            <img src="/assets/img/menu.svg" alt="menu icon" />
          </button>
          <button class="btn position-relative">
            <img src="/assets/img/bell-fill.svg" alt="notification icon" />
            <span
              v-if="watchRequests && watchRequests.length > 0"
              class="
                position-absolute
                top-0
                start-100
                translate-middle
                badge
                rounded-pill
                bg-danger
              "
            >
              {{ watchRequests.length }}
              <span class="visually-hidden">unread messages</span>
            </span>
          </button>
          <span v-if="!network">you are currently offline</span>
          <span v-if="!socketConnected && network"
            >connecting to server...</span
          >
        </header>

        <ul class="nav nav-tabs" id="myTab" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link active fw-bold"
              id="chat-tab"
              data-bs-toggle="tab"
              data-bs-target="#chat"
              type="button"
              role="tab"
              aria-controls="chat"
              aria-selected="true"
            >
              Chat
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link fw-bold"
              id="search-tab"
              data-bs-toggle="tab"
              data-bs-target="#search-content"
              type="button"
              role="tab"
              aria-controls="search-content"
              aria-selected="false"
            >
              Search
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link fw-bold"
              id="requests-tab"
              data-bs-toggle="tab"
              data-bs-target="#requests"
              type="button"
              role="tab"
              aria-controls="requests"
              aria-selected="false"
              style="position: relative"
            >
              requests
              <span
                v-if="friendRequests && friendRequests.length > 0"
                class="
                  position-absolute
                  top-0
                  start-100
                  translate-middle
                  badge
                  rounded-pill
                  bg-danger
                "
              >
                {{ friendRequests.length }}
                <span class="visually-hidden">unread messages</span>
              </span>
            </button>
          </li>
        </ul>
        <div class="tab-content" id="myTabContent">
          <div
            class="tab-pane fade show active"
            id="chat"
            role="tabpanel"
            aria-labelledby="chat-tab"
          >
            <chatList
              title="Chat"
              :userList="friendShips"
              @open="({ _id }) => $router.push('/home?chat=' + _id)"
              :currentChat="currChatFriendshipId"
            />
          </div>
          <div
            class="tab-pane fade"
            id="search-content"
            role="tabpanel"
            aria-labelledby="search-tab"
          >
            <chatList
              title="Search"
              :filter="filter"
              :userList="searchResults"
              @open="viewFriendship"
              :currentChat="currChatFriendshipId"
            />
          </div>
          <div
            class="tab-pane fade"
            id="requests"
            role="tabpanel"
            aria-labelledby="requests-tab"
          >
            <chatList
              v-if="user"
              title="Friend Requests"
              :userList="friendRequests"
              @open="viewFriendship"
              :currentChat="currChatFriendshipId"
            />
          </div>
        </div>
      </div>
      <div
        :class="{
          'main-chat': true,
          active: homeView === 'chatbody',
          hidden: homeView !== 'chatbody'
        }"
      >
        <div
          :class="{
            'active-chat': true,
            prominent: chatProminent
          }"
          v-if="currFriend"
        >
          <header class="chat-header">
            <button class="chatBack" @click="$router.push('/home')">
              <svg
                fill="white"
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="0 0 64 64"
                style="enable-background: new 0 0 64 64"
                xml:space="preserve"
              >
                <path
                  d="M61.3,29.4h-54l5.3-6.4c1.1-1.1,0.8-2.9-0.3-3.7c-1.1-1.1-2.9-0.8-3.7,0.3l-7.5,8.8c-1.6,2.1-1.6,5.1,0,7.2l7.5,8.8
	c0.3,0.8,1.1,1.1,1.9,1.1c0.5,0,1.3-0.3,1.6-0.5c1.1-1.1,1.3-2.7,0.3-3.7l-5.3-6.4h54.2c1.6,0,2.7-1.1,2.7-2.7
	C64,30.5,62.9,29.4,61.3,29.4z"
                />
              </svg>
            </button>
            <div class="chat-header__info-display">
              <viewImageModal
                :showModal="profileImageOpen"
                @close="profileImageOpen = false"
                :src="
                  currFriend.imgUrl || '/assets/img/abstract-user-flat-1.svg'
                "
                :alt="'profile picture'"
              />
              <img
                @click="profileImageOpen = !profileImageOpen"
                class="chat-header__profile-img"
                v-if="!currFriend.imgUrl"
                src="/assets/img/abstract-user-flat-1.svg"
                alt=""
              />
              <img
                @click="profileImageOpen = !profileImageOpen"
                class="chat-header__profile-img"
                v-if="currFriend.imgUrl"
                :src="currFriend.imgUrl"
                alt=""
              />
              <h1
                class="chat-header__name"
                @click="viewCurrentFriendProfile = true"
              >
                {{ currFriend.username }}
              </h1>
            </div>
            <button
              class="btn btn-success"
              @click="
                showVideo = true;
                player.loadComponent = true;
              "
            >
              watch
            </button>
            <button
              class="btn btn-success"
              v-if="chatProminent"
              @click="makeChatBackdrop"
            >
              hide chat
            </button>
          </header>
          <newModal
            :showModal="viewCurrentFriendProfile"
            @close="viewCurrentFriendProfile = false"
          >
            <template v-slot:full-replace>
              <smart-profile
                :userId="viewCurrentFriendProfile && currFriend.friendId"
              />
            </template>
          </newModal>
          <chatBody
            ref="chatBody"
            :key="currChatFriendshipId"
            :friendship_id="currChatFriendshipId"
            :messages="currChatMessages"
            :highlighted="highlightedMessageId"
            @replyClick="replyHandler"
            @viewMore="viewMore"
            :loadingMore="loadingMore"
            class="chatBody"
          />
          <div class="lds-ellipsis typing op">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <!-- for now we want to destroy it every time, but very possibly we may not want to in the future
            hence both the v-if and display
             -->
          <chat-text
            :highlighted="highlightedMessageId"
            @newMessage="handleNewMessage"
            @cancelReply="cancelReply"
            @typing="handleTyping"
          ></chat-text>
        </div>
        <div class="empty-chat" v-if="!currFriend">Open a chat</div>
        <div v-if="sharedImage">
          <img :src="sharedImage.url" />
        </div>

        <!-- we can cause problems here if we exit the session without exiting the session -->
        <YTPlayer
          v-if="player.loadComponent"
          :display="true"
          :forwardedPendingRequest="player.pendingRequest"
          @close="
            player = { friendship_id: null, url: null, loadComponent: null }
          "
          @toggleChat="makeChatProminent"
        />
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import chatList from "@/components/chatList.vue";
import chatText from "@/components/chatText.vue";
import chatBody from "@/components/chatBody.vue";
import sideMenu from "@/components/sideMenu.vue";
import viewImageModal from "@/components/viewImageModal.vue";
import newModal from "@/components/newModal.vue";
import {
  getCookie,
  getMessagePage,
  getUsers,
  logout,
  enableNotifs,
  enableSound,
  disableNotifs,
  disableSound,
  subscribeToNotif,
  unsubscribeToNotif,
  signOutOfFirebase,
  getSharedImage
} from "@/common";

import { mapGetters, mapActions, mapMutations } from "vuex";
import store from "../store/index";
import "notyf/notyf.min.css";
import NewProfile from "@/components/newProfile.vue";
import SmartProfile from "@/components/smartProfile.vue";
import YTPlayer from "@/components/YTPlayer.vue";

export default Vue.extend({
  name: "home",
  props: ["chat"],
  mounted() {
    if (this.$route.query.chat) {
      /** if the data isnt loaded yet then there is a line in the setup that will do this for us */
      if (this.dataLoaded) {
        this.openChat({ _id: this.$route.query.chat });
      }
    } else {
      this.setCurrentChat("");
      this.setHomeView("chatlist");
    }
    if ("share" in this.$route.query) {
      getSharedImage().then(image => {
        this.setSharedImage({ image, url: URL.createObjectURL(image) });
      });
      // might be sketch
      this.$router.replace("/");
    }
    // the handler for this listener will run ONLY if the YT component is not loaded
    // if the component is loaded then it will handle this itself
    this.addOneTimeListener({
      customName: "Home",
      event: "watchSessRequest",
      handler: data => {
        if (!this.player.loadComponent) {
          this.player.pendingRequest = data;
          this.player.loadComponent = true;
        }
      }
    });
  },
  data() {
    return {
      sideMenuActive: false,
      profileImageOpen: false,
      modalData: { openProfile: false, visibleProfile: {} },
      currentMessages: [],
      searchResults: [],
      highlightedMessageId: null,
      typing: {},
      viewCurrentFriendProfile: false,
      loadingMore: false,
      showVideo: false,
      player: {
        loadComponent: false,
        url: null,
        friendship_id: null
      }
    };
  },
  methods: {
    ...mapActions([
      "addOneTimeListener",
      "setFriends",
      "setUpApp",
      "loadMessages",
      "setCurrentChat",
      "emitEvent"
    ]),
    ...mapMutations([
      "setNotifAudioFile",
      "updateLastMessage",
      "hideTyping",
      "clearSharedImage",
      "showTyping",
      "addGroupToChatSart",
      "appendMessageToChat",
      "updateSentMessage",
      "setHomeView",
      "enablePopupNotif",
      "disablePopupNotif",
      "makeChatBackdrop",
      "makeChatProminent",
      "setSharedImage"
    ]),
    tabChanged(tabId) {
      if (tabId === "tab-requests") {
        // clear unread requests
      }
    },
    goToProfile() {
      this.$router.push("/profile");
    },
    setSound: enable => {
      if (enable) {
        return enableSound();
      }
      disableSound();
    },
    setNotif: enable => {
      if (enable) {
        return enableNotifs();
      }
      disableNotifs();
    },
    logout() {
      /** @todo send some indication this was an automatic unsubcription, maybe in
       * the future we can treat this user differently
       */
      return logout()
        .then(data => this.$router.push("/login"))
        .catch(err => console.log(err)); //alert("error logging out, please try again!"));
    },
    viewMore() {
      /** get the next 100 message from the chat history
       * starting with the timestamp of our latest message
       * (which will be the first in the messages array)and going backward
       */
      this.loadingMore = true;
      getMessagePage({
        friendship_id: this.currChatFriendshipId,
        limit: 100,
        timestamp: this.messages[this.currChatFriendshipId][0].createdAt,
        msgId: this.messages[this.currChatFriendshipId][0].msgId
      })
        .then(({ data }) => {
          /**
           * @todo - I need to account for instances where we will get the messages that have the same timestamp
           * as the timestamp used to create this page 3rd param of getMessagePage call
           */
          this.addGroupToChatSart({
            friendship_id: this.currChatFriendshipId,
            messages: data
          });
          this.loadingMore = false;
        })
        .catch(err => {
          this.loadingMore = false;
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
        friendship_id: this.currChatFriendshipId,
        /** we let the server append the id but we need it right now in lastmessage */
        lastMessage: { fromId: this.user.id, ...message }
      });
      // TODO: FIXME: implement sort and search algorith for messages or get data from the sub component
      // massive performance issue
      if (message.hID) {
        for (const chatMessage of this.messages[this.currChatFriendshipId]) {
          if (chatMessage.msgId === message.hID) {
            quoted = chatMessage;
            break;
          }
        }
      }
      this.appendMessageToChat({
        friendship_id: this.currChatFriendshipId,
        message: {
          ...message,
          quoted,
          fromId: this.user.id,
          createdAt: Date.now()
        }
      });
      let index = this.messages[this.currChatFriendshipId].length - 1;

      if (message.type === "media") {
        message.uploadPromise
          .then(url => {
            delete message.uploadPromise;
            this.messages[this.currChatFriendshipId][index].url = url;
            return this.emitEvent({
              eventName: "sendMessage",
              data: {
                friendship_id: this.currChatFriendshipId,
                ...message,
                url
              }
            });
          })
          .then(data => {
            this.updateSentMessage({
              friendship_id: this.currChatFriendshipId,
              index,
              msgId: data.msgId,
              _id: data._id,
              createdAt: data.createdAt
            });
          })
          .catch(err => {
            if (err) {
              console.log("error sending message", err);
            }
          });
      } else {
        this.emitEvent({
          eventName: "sendMessage",
          data: {
            friendship_id: this.currChatFriendshipId,
            ...message
          }
        })
          .then(data => {
            this.updateSentMessage({
              friendship_id: this.currChatFriendshipId,
              index,
              msgId: data.msgId,
              _id: data._id,
              createdAt: data.createdAt
            });
          })
          .catch(err => {
            if (err) {
              console.log("error sending message", err);
            }
          });
      }
    },
    handleTyping(e) {
      var friendship_id = this.currChatFriendshipId;
      /** if we're not already recorded as "typing" */
      if (!this.typing.status) {
        this.emitEvent({
          eventName: "sendMessage",
          data: {
            friendship_id,
            type: "typing",
            status: "start"
          }
        }).catch(() => console.log("error sending typing"));
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
            }).catch(() => console.log("error stopping typing"));
          }
        }, 100);
      }
    },
    viewFriendship(friendShip) {
      this.modalData.visibleProfile = friendShip;
      this.modalData.openProfile = true;
    },
    openChat(friendShip) {
      let friendship_id = friendShip._id;
      this.setCurrentChat(friendship_id);
      this.setHomeView("chatbody");
    },
    async filter(filterString: string) {
      if (!filterString) {
        return [];
      }
      return getUsers(filterString).then(({ data }) => data);
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
  watch: {
    $route(params) {
      if (params.query.chat) {
        this.openChat({ _id: params.query.chat });
      } else {
        this.setCurrentChat("");
        this.setHomeView("chatlist");
      }
    }
  },
  computed: {
    ...mapGetters([
      "friendShips",
      "network",
      "user",
      "messages",
      "watchRequests",
      "friendRequests",
      "socket",
      "currChatFriendshipId",
      "currChatMessages",
      "socketConnected",
      "sharedImage",
      "dataLoaded",
      "chatProminent",
      "homeView"
    ]),
    sideMenuData() {
      return [
        {
          type: "click",
          name: "logout",
          handler: this.logout
        },
        {
          type: "click",
          name: "profile",
          handler: this.goToProfile
        },
        {
          type: "submenu",
          name: "notifications",
          submenu: [
            {
              type: "toggle",
              name: "popup notifications",
              checked: store.state.enableVisualNotif,
              change: this.setNotif
            },
            {
              type: "click",
              name: "subscribe to push",
              handler: subscribeToNotif
            },
            {
              type: "click",
              name: "UNsubscribe to push",
              handler: unsubscribeToNotif
            },
            {
              type: "l2menu",
              name: "sound notifications",
              submenu: [
                {
                  type: "toggle",
                  name: "toggle sound",
                  checked: store.state.enableSoundNotif,
                  change: this.setSound
                },
                ...[
                  "goes-without-saying.mp3",
                  "hasty-ba-dum-tss.mp3",
                  "juntos.mp3",
                  "swiftly.mp3",
                  "that-was-quick.mp3",
                  "when.mp3"
                ].map(file => ({
                  type: "sound",
                  src: `/${file}`,
                  name: file.split(".")[0],
                  active: store.state.notifAudioFile === file,
                  handler: this.setNotifAudioFile
                }))
              ]
            }
          ]
        }
      ];
    },
    currFriend() {
      if (this.friendShips) {
        return this.friendShips.find(
          friendShip => friendShip._id === this.currChatFriendshipId
        );
      }
      return false;
    }
  },
  components: {
    chatBody,
    chatList,
    chatText,
    newModal,
    sideMenu,
    viewImageModal,
    NewProfile,
    SmartProfile,
    YTPlayer
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
.chat-header__name {
  cursor: pointer;
}

.nav-link {
  color: var(--bs-white);
  text-transform: uppercase;
  .active {
    color: var(--bs-secondary);
  }
}

.chat__sidebar {
  background-color: var(--bs-green);
  width: 350px;
  min-width: 350px;
  height: 100vh;
  overflow-y: scroll;
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

.active-chat.prominent {
  position: absolute;
  /* width: 100%; */
  background: rgba(4, 4, 4, 0.4);
  z-index: 1000;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  opacity: 0.7;
}

.badge {
  width: 19px;
  height: 19px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 2px;
  right: 2px;
  background: red;
  border-radius: 100%;
  color: #fff;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  letter-spacing: -0.05em;
  font-family: "Roboto Mono", monospace;
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
  color: white;
  flex-grow: 1;
  align-items: center;
  display: flex;
  background: var(--bs-green);
  border-bottom: 1px solid white;
  font-weight: bold;
  height: var(--main-header-height);
}

.btn img {
  width: 20px;
}

.menubt {
  --display: none;
  --notification-content: "";
  background-color: transparent;
  white-space: nowrap;
  text-overflow: ellipsis;
  &:not(:last-child) {
    margin-right: 8px;
  }
  &:hover {
    font-weight: bold;
    background-color: transparent;
  }
  img {
    width: 18px;
  }
}

.main-section {
  display: flex;
  height: 100vh;
}

.chat-header {
  display: flex;
  background: var(--bs-green);
  color: white;
  text-align: center;
  padding: 0.5rem;

  &__profile-img {
    cursor: pointer;
    width: 64px;
    height: 64px;
    top: initial;
    left: initial;
    border-radius: 50%;
    margin-right: 16px;
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

.reconnecting {
  background: orange;
}

.offline {
  background: rgb(225, 0, 0);
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
    height: 100vh;
  }
  .chatBack {
    display: block;
    color: white;
    font-weight: bold;
    width: 40px;
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
