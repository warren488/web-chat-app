<template>
  <div class="chatList">
    <header>
      <h1>Friends</h1>
      <input
        type="text"
        id="search"
        placeholder="Search..."
        class="search-bar"
      />
    </header>
    <ol>
      <li
        v-for="friend of myFriends"
        :key="friend._id"
        :id="friend._id"
        :class="{ active: friend._id === currentChat }"
        @click="$emit('open', friend._id)"
      >
        <h1>{{ friend.username }}</h1>
        <p class="last-message" v-if="friend.lastMessage[0]">
          <span v-if="friend.lastMessage[0].status !== 'typing'">{{
            friend.lastMessage[0].from === getCookie("username")
              ? "me:"
              : `${friend.lastMessage[0].from}:`
          }}</span>
          {{ friend.lastMessage[0].text ? friend.lastMessage[0].text : "" }}
        </p>
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { getCookie } from "@/common";

export default Vue.extend({
  name: "HelloWorld",
  props: {
    friends: Array,
    currentChat: String
  },
  methods: {
    getCookie
  },
  computed: {
    myFriends() {
      return this.friends;
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
header h1 {
  text-align: center;
}
.chatList {
  background: linear-gradient(
    89.81deg,
    rgb(58, 97, 54) 0.03%,
    rgb(0, 93, 64) 64.36%
  );
  // padding: 5px;
  color: beige;
}
ol {
  text-decoration: none;
  list-style: none;
  padding-left: 0px;
  li {
    margin: 0px;
    padding: 15px 5px 5px;
    width: 100%;
    border-bottom: thin beige solid;
    h1 {
      text-transform: uppercase;
      font-weight: bold;
    }
    &:hover {
      border-bottom: thin rgb(57, 83, 60) solid;
      color: rgb(57, 83, 60);
      cursor: pointer;
    }
    &.active {
      background-color: beige;
      border-bottom-color: transparent;
      color: rgb(57, 83, 60);
    }
  }
}
.search-bar {
  border: none;
  width: 100%;
  padding: 6px;
  display: block;
}
</style>
