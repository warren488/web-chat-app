<template>
  <div class="home">
    <div class="chat__sidebar">
      <chatList :friends="friends" @open="openChat" :currentChat="currChat" />
    </div>
    <div class="main-chat">
      <header class="chatHeader" v-if="currFriend">
        <h1>{{ currFriend.username }}</h1>
        <p class="typing op">typing...</p>
      </header>
      <chatBody
        :key="currChat"
        :friendship_id="currChat"
        :messages="currMessages"
        :highlighted="highlightedMessageId"
        @replyClick="replyHandler"
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
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import chatList from "@/components/chatList.vue";
import chatText from "@/components/chatText.vue";
import chatBody from "@/components/chatBody.vue";
import {
  getFriends,
  getCookie,
  getMessages,
  getLastMessage,
  notifyMe
} from "@/common";
import { mapGetters, mapActions, mapMutations } from "vuex";
import io from "socket.io-client";

export default Vue.extend({
  name: "home",
  data() {
    return {
      messages: Object({}),
      currentChat: "",
      currentMessages: [],
      highlightedMessageId: null,
      socket: null,
      typing: {}
    };
  },
  methods: {
    // scrollBottom: scrollBottom.bind(this),
    ...mapActions(["setFriends"]),
    ...mapMutations(["updateLastMessage", "hideTyping", "showTyping"]),
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
      /** send message to the server via the socket */
      this.socket.emit(
        "sendMessage",
        {
          friendship_id: this.currentChat,
          text: message.text,
          hID: message.hID
        },
        (err, data) => {
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
    openChat(frienship_id: string) {
      if (!this.messages[frienship_id]) {
        getMessages(frienship_id).then(({ data }) => {
          this.messages[frienship_id] = data;
          this.currentMessages = this.messages[frienship_id];
          this.currentChat = frienship_id;
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
        this.currentMessages = this.messages[frienship_id];
        this.currentChat = frienship_id;
      }
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
        this.openChat(this.friends[0]._id);
      });
    }
    this.socket = io("http://localhost:3001");
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
    chatText
  }
});
</script>
<style lang="scss" scoped>
.chat__sidebar {
  width: 350px;
  height: 100%;
}
.chatList {
  height: 100%;
}
.home {
  height: 100%;
  display: flex;
}
.main-chat {
  width: 100%;
  display: flex;
  flex-direction: column;
}
.chatBody {
  flex-grow: 1;
}
.chatHeader {
  background: linear-gradient(
    89.81deg,
    rgb(0, 93, 64) 0.03%,
    rgb(58, 97, 54) 64.36%
  );
  color: white;
  text-align: center;
  padding: 15px;
  h1 {
    text-transform: uppercase;
    font-weight: bold;
  }
}
.op {
  opacity: 0;
}
</style>
