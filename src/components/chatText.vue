<template>
  <div>
    <div class="chat__footer">
      <form @submit.prevent="sendMessage" id="message-form">
        <button @click="toggleEmojis" id="emoji-button" type="button">
          &#128578;
        </button>
        <input
          ref="msgText"
          type="text"
          id="msg-txt"
          name="message"
          placeholder="send message..."
          autocomplete="off"
          autofocus
          @keydown="$emit('typing')"
        />
        <button id="send-button">
          <img src="../assets/send.svg" alt />
        </button>
        <button
          type="button"
          :class="{ 'no-show': highlighted === null }"
          @click="$emit('cancelReply')"
          class="cancel-reply"
        >
          <img src="../assets/close.svg" alt />
        </button>
      </form>
    </div>
    <div ref="emojis" class="emojis" id="my-emojis">
      <span
        @click="addEmoji"
        v-for="(emoji, i) in emojis"
        :key="i"
        :data-value="emoji"
        >{{ emoji }}</span
      >
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { getCookie } from "@/common";

export default Vue.extend({
  name: "",
  data() {
    return {
      emojis: [
        "😀",
        "😁",
        "😂",
        "😃",
        "😄",
        "😅",
        "😆",
        "😇",
        "😈",
        "😉",
        "😊",
        "😋",
        "😌",
        "😍",
        "😎",
        "😏",
        "😐",
        "😑",
        "😒",
        "😓",
        "😔",
        "😕",
        "😖",
        "😗",
        "😘",
        "😙",
        "😚",
        "😛",
        "😜",
        "😝",
        "😞",
        "😟",
        "😠",
        "😡",
        "😢",
        "😣",
        "😤",
        "😥",
        "😦",
        "😧",
        "😨",
        "😩",
        "😪",
        "😫",
        "😬",
        "😭",
        "😮",
        "😯",
        "😰",
        "😱",
        "😲",
        "😳",
        "😴",
        "😵",
        "😶",
        "😷",
        "🙁",
        "🙂",
        "🙃",
        "🙄",
        "🤐",
        "🤑",
        "🤒",
        "🤓",
        "🤔",
        "🤕",
        "🤠",
        "🤡",
        "🤢",
        "🤣",
        "🤤",
        "🤥",
        "🤧",
        "🤨",
        "🤩",
        "🤪",
        "🤫",
        "🤬",
        "🤭",
        "🤮",
        "🤯",
        "🧐"
      ]
    };
  },
  props: {
    highlighted: String,
    typing: {}
  },
  methods: {
    addEmoji(e) {
      if (e.target.dataset.value) {
        this.$refs.msgText.value += e.target.dataset.value;
        this.$refs.msgText.focus();
      }
    },
    toggleEmojis() {
      this.$refs.emojis.classList.toggle("show");
    },
    sendMessage() {
      let msg = this.$refs.msgText.value;
      if (!msg) {
        return;
      }
      this.$emit("newMessage", {
        text: msg,
        /** @todo changename failure
         * @NB this will require extra special treatment as many things will use the
         */
        from: getCookie("username"),
        // server uses it's own timestamp... hmmmm
        createdAt: Date.now(),
        status: "pending",
        hID: this.highlighted
      });
      this.$refs.msgText.value = "";
    }
  },
  watch: {
    highlighted() {
      this.$refs.msgText.focus();
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.chat__footer {
  background: #e6eaee;
  padding: 10px;
  position: relative;
  display: flex;
  flex-shrink: 0;
  button {
    background: transparent;
    border: none;
  }
  form {
    flex-grow: 1;
    display: flex;
    * {
      margin-right: 10px;
    }
    input {
      margin-left: 10px;
      border-radius: 20px;
    }
  }
  input {
    border: none;
    padding: 10px;
    flex-grow: 1;
  }
}
@media (max-width: 600px) {
  .chat__footer {
    flex-direction: column;
    button {
      margin-right: 0;
    }
  }
}

#send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  img {
    width: 40px;
    margin: 0px;
  }
}
.cancel-reply {
  transition: width 0.5s;
  width: 1em;
  overflow: hidden;
  img {
    height: 1rem;
  }
}
.no-show {
  // display: none
  width: 0px;
  // margin: 0px;
}
.emojis {
  overflow-y: scroll;
  cursor: pointer;
  height: 0px;
  min-height: 0px;
}

.emojis span {
  font-family: "Font Awesome 5 Free";
  font-size: 2rem;
}

#emoji-button {
  background-color: transparent;
  cursor: pointer;
  padding: 0px;
  margin-left: 10px;
  font-size: 2rem;
}

.emojis.show {
  /* display: block; */
  min-height: 150px;
}
</style>
