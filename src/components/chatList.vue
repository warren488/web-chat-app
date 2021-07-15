<template>
  <div class="chatList">
    <header>
      <input
        type="text"
        id="search"
        placeholder="Search..."
        class="search-bar"
        v-model="filterString"
        @input="filterFuncDebounced"
      />
    </header>
    <ol class="item-list">
      <li
        v-for="friend of myFriends"
        :key="friend._id"
        :id="friend._id"
        :class="{
          active: friend._id === currentChat,
          'chat-preview': true,
          'notification-item': true
        }"
        @click="() => emitOpen(friend)"
      >
        <div style="display: flex; max-width: 100%">
          <img
            class="profile-img"
            v-if="!friend.imgUrl"
            src="/assets/img/abstract-user-flat-1.svg"
            alt=""
          />
          <img
            class="profile-img"
            v-if="friend.imgUrl"
            :src="friend.imgUrl"
            alt=""
          />
          <div class="preview-text">
            <h3 class="">
              {{ friend.username }}
            </h3>
            <p
              class="last-message"
              v-if="friend.lastMessage && friend.lastMessage[0]"
            >
              <span v-if="friend.lastMessage[0].status !== 'typing'">{{
                friend.lastMessage[0].fromId === user.id
                  ? "me:"
                  : `${friend.username}:`
              }}</span>
              {{ friend.lastMessage[0].text ? friend.lastMessage[0].text : "" }}
            </p>
          </div>
        </div>
        <span
          v-if="unreads && unreads[friend._id] > 0"
          class="badge bg-secondary"
          >{{ unreads[friend._id] }}</span
        >
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { getCookie } from "@/common";
import { debounce } from "debounce";
import { mapGetters } from "vuex";

export default Vue.extend({
  created() {
    console.log("unreads", this.unreads);

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
    ...mapGetters(["user", "unreads"]),
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

.badge {
  background-color: beige;
  border-radius: 50%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--bs-green);
}

.chat-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  --notif-bottom-pos: 4px;
  --notif-right-pos: 4px;
}

.preview-text {
  white-space: nowrap;
  overflow: hidden;
  h3 {
    font-size: 16px;
  }
  p {
    margin-bottom: 0px;
  }
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
  background: var(--bs-green);
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
      background-color: rgb(143, 143, 96);
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
