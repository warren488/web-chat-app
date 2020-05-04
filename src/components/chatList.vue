<template>
  <div class="chatList">
    <header>
      <h1>{{ header || "Friends" }}</h1>
      <input
        type="text"
        id="search"
        placeholder="Search..."
        class="search-bar"
        v-model="filterString"
        @input="filterFuncDebounced"
      />
    </header>
    <ol>
      <li
        v-for="friend of myFriends"
        :key="friend._id"
        :id="friend._id"
        :class="{ active: friend._id === currentChat, 'chat-preview': true }"
        @click="() => emitOpen(friend)"
      >
        <!-- <span> -->
        <img
          class="profile-img"
          v-if="!friend.imgUrl"
          src="../assets/abstract-user-flat-1.svg"
          alt=""
        />
        <img
          class="profile-img"
          v-if="friend.imgUrl"
          :src="friend.imgUrl"
          alt=""
        />
        <!-- </span> -->
        <div class="preview-text">
          <h3>
            {{ friend.username }}
          </h3>
          <p
            class="last-message"
            v-if="friend.lastMessage && friend.lastMessage[0]"
          >
            <!-- @todo changename failure -->
            <span v-if="friend.lastMessage[0].status !== 'typing'">{{
              friend.lastMessage[0].from === getCookie("username")
                ? "me:"
                : `${friend.lastMessage[0].from}:`
            }}</span>
            {{ friend.lastMessage[0].text ? friend.lastMessage[0].text : "" }}
          </p>
        </div>
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { getCookie } from "@/common";
import { debounce } from "debounce";

export default Vue.extend({
  created() {
    let self = this;
    this.filterFuncDebounced = debounce(function() {
      if (self.filter) {
        return self.filter(self.filterString);
      }
      return self.friends.filter(friend =>
        friend.username.includes(self.filterString)
      );
    }, 300);
  },
  name: "chatList",
  data() {
    return {
      filterString: ""
    };
  },
  props: {
    title: String,
    friends: Array,
    currentChat: String,
    filter: Function
  },
  methods: {
    getCookie,
    emitOpen(friend) {
      /** @todo - in the future we want to simply get and array of names
       * and then load full user data once we open a profile instead of search results containing
       * full data for all users returned
       */
      this.$emit("open", friend);
    },
    filterFunc: function() {
      if (this.props.filter) {
        return this.props.filter(this.filterString);
      }
      return this.friends.filter(friend =>
        friend.username.includes(this.filterString)
      );
    }
  },
  computed: {
    myFriends() {
      return this.friends;
    },
    header() {
      return this.title;
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.last-message {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-preview {
  display: flex;
  align-items: center;
}

.preview-text {
  white-space: nowrap;
  overflow: hidden;
}

.profile-img {
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-right: 5px;
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
    padding: 5px 5px 5px;
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
