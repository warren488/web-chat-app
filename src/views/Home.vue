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
        class="chatBody"
        msg="Welcome to Your Vue.js + TypeScript App"
      />
      <chat-text></chat-text>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import chatList from "@/components/chatList.vue"; // @ is an alias to /src
import chatText from "@/components/chatText.vue"; // @ is an alias to /src
import chatBody from "@/components/chatBody.vue"; // @ is an alias to /src
import { getFriends, getCookie, getMessages } from "@/common";

export default Vue.extend({
  name: "home",
  data() {
    return {
      friends: [],
      messages: Object({}),
      currentChat: ""
    };
  },
  methods: {
    openChat(frienship_id: string) {
      getMessages(frienship_id).then(({ data }) => {
        this.messages[frienship_id] = data;
        this.currentChat = frienship_id;
      });
    }
  },
  created() {
    getFriends().then(({ data }) => {
      this.friends = data;
      return this.openChat(this.friends[0]._id);
    });
    setTimeout(() => {
      this.messages[this.currChat].push(this.messages[this.currChat][0]);
    }, 5000);
  },
  computed: {
    myFriends(): Array<Object> {
      return this.friends;
    },
    currChat(): string {
      return this.currentChat;
    },
    currMessages() {
      console.log(this.messages);
      console.log(this.currChat);
      return this.messages[this.currChat];
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
