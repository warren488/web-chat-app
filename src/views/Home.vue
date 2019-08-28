<template>
  <div class="home">
    <div class="chat__sidebar">
      <chatList :friends="friends" @open="openChat" />
    </div>
    <div class="main-chat">
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
      ></chat-text>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import chatList from "@/components/chatList.vue";
import chatText from "@/components/chatText.vue";
import chatBody from "@/components/chatBody.vue";
import { getFriends, getCookie, getMessages } from "@/common";
import { mapGetters, mapActions } from "vuex";
import io from "socket.io-client";

export default Vue.extend({
  name: "home",
  data() {
    return {
      messages: Object({}),
      currentChat: "",
      currentMessages: [],
      highlightedMessageId: null
    };
  },
  methods: {
    ...mapActions(["setFriends"]),
    handleNewMessage(message) {
      this.cancelReply();
      let quoted;
      // TODO: FIXME: implement sort and search algorith for messages or get data from the sub component
      // massive performance issue
      for (const chatMessage of this.messages[this.currentChat]) {
        if (chatMessage._id === message.hID) {
          quoted = chatMessage;
        }
      }
      this.messages[this.currChat].push({
        ...message,
        quoted
      });
    },
    openChat(frienship_id: string) {
      if (!this.messages[frienship_id]) {
        getMessages(frienship_id).then(({ data }) => {
          this.messages[frienship_id] = data;
          this.currentMessages = this.messages[frienship_id];
          this.currentChat = frienship_id;
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
    const socket = io("http://localhost:3001");
  },
  computed: {
    ...mapGetters(["friends"]),
    currChat(): string {
      return this.currentChat;
    },
    currMessages() {
      return this.currentMessages;
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
</style>
