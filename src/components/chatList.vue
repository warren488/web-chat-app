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
        v-for="friendShip of myUserList"
        :key="friendShip._id"
        :id="friendShip._id"
        :class="{
          active: friendShip._id === currentChat,
          'chat-preview': true,
          'notification-item': true
        }"
        @click="() => emitOpen(friendShip)"
      >
        <div style="display: flex; max-width: 100%">
          <img
            class="profile-img"
            v-if="!friendShip.imgUrl"
            src="/assets/img/abstract-user-flat-1.svg"
            alt=""
          />
          <img
            class="profile-img"
            v-if="friendShip.imgUrl"
            :src="friendShip.imgUrl"
            alt=""
          />
          <div class="preview-text">
            <h3 class="">
              {{ friendShip.username }}
            </h3>
            <p
              class="last-message"
              v-if="friendShip.lastMessage && friendShip.lastMessage[0]"
            >
              <span v-if="friendShip.lastMessage[0].status !== 'typing'">{{
                friendShip.lastMessage[0].fromId === user.id
                  ? "me:"
                  : `${friendShip.username}:`
              }}</span>
              {{
                friendShip.lastMessage[0].text
                  ? friendShip.lastMessage[0].text
                  : ""
              }}
            </p>
          </div>
        </div>
        <span
          v-if="unreads && unreads[friendShip._id] > 0"
          class="badge bg-secondary"
          >{{ unreads[friendShip._id] }}</span
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
  name: "chatList",
  data() {
    return {
      filterString: ""
    };
  },
  props: {
    title: String,
    userList: Array,
    currentChat: String,
    filter: Function
  },
  created() {
    let self = this;
    this.filterFuncDebounced = debounce(function() {
      if (self.filter) {
        return self.filter(self.filterString);
      }
      return self.userList.filter(user =>
        user.username.includes(self.filterString)
      );
    }, 300);
  },
  methods: {
    getCookie,
    emitOpen(friendShip) {
      /** @todo - in the future we want to simply get and array of names
       * and then load full user data once we open a profile instead of search results containing
       * full data for all users returned
       */
      this.$emit("open", friendShip);
    },
    filterFunc: function() {
      if (this.props.filter) {
        return this.props.filter(this.filterString);
      }
      return this.userList.filter(friendShip =>
        friendShip.username.includes(this.filterString)
      );
    }
  },
  computed: {
    ...mapGetters(["user", "unreads"]),
    myUserList() {
      return this.userList;
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
