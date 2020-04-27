<template>
  <div ref="messageScroll" class="chat__main">
    <button class="chat__view-more" @click="viewMore">View more</button>
    <ol class="chat__messages" id="messages">
      <li
        v-for="message of allMessages"
        :key="message._id"
        :class="{
          [message.status]: message.from === getCookie('username'),
          me: message.from === getCookie('username')
        }"
        :id="message._id"
      >
        <div class="message">
          <div class="message__title">
            <h4>
              {{ message.from === getCookie("username") ? "me" : message.from }}
            </h4>
            <span>{{ new Date(message.createdAt).toLocaleTimeString() }}</span>
            <p class="reply" @click="replyClick(message._id)">reply</p>
          </div>
          <div class="message__body">
            <p class="wrap">{{ message.text }}</p>
            <span v-if="message.quoted" class="quoted">
              <div class="message__title">
                <h4>
                  {{
                    message.quoted.from === getCookie("username")
                      ? "me"
                      : message.quoted.from
                  }}
                </h4>
                <span>
                  {{ new Date(message.quoted.createdAt).toLocaleTimeString() }}
                </span>
              </div>
              <p class="wrap">{{ message.quoted.text }}</p>
            </span>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import { getCookie, getMessages, getMessagePage, scrollBottom } from "@/common";
interface Message {
  name: string;
  text: string;
}
import Vue from "vue";

export default Vue.extend({
  props: {
    frienship_id: String,
    messages: Array,
    highlighted: String
  },
  data() {
    return {};
  },
  mounted() {
    scrollBottom.call(this, { force: true, test: false });
  },
  created() {},
  methods: {
    getCookie,
    replyClick(msgId: string): void {
      this.$emit("replyClick", msgId);
    },
    viewMore() {
      this.$emit("viewMore");
    }
  },
  computed: {
    allMessages(): Array<Message> {
      return this.messages;
    }
  },
  updated() {
    scrollBottom.call(this, { force: false, test: false });
  },
  watch: {
    highlighted(newVal: string, oldVal: string): void {
      let previouslyHighlightedElem = document.getElementById(oldVal);
      let newlyHighlightedElem = document.getElementById(newVal);
      if (previouslyHighlightedElem) {
        previouslyHighlightedElem.classList.remove("highlighted");
      }
      if (newlyHighlightedElem) {
        newlyHighlightedElem.classList.add("highlighted");
      }
    }
  }
});
</script>

<style>
.chat__main {
  max-height: 100vh;
  overflow-y: scroll;
}
.chat__messages li {
  display: flex;
}

.chat__messages {
  list-style-type: none;
}

.chat__messages li.me {
  justify-content: flex-end;
}

.reply {
  color: #999;
  cursor: pointer;
  margin-left: 5px;
}
.quoted {
  background-color: rgb(202, 202, 202);
  display: inline-block;
  border: thin solid rgb(202, 202, 202);
  border-radius: 9px;
  padding: 5px;
  margin-left: 5%;
  margin-top: 5px;
  width: 95%;
  box-shadow: 1px 1px 3px gray;
}
.chat__messages {
  -webkit-overflow-scrolling: touch;
  padding: 10px;
}
.message {
  padding: 5px;
  padding-left: 10px;
  background-color: #e6eaee;
  border-radius: 9px;
  margin: 5px;
  max-width: 80%;
  box-shadow: 3px 3px 3px lightgray;
}

.message:hover {
  background-color: #f6faff;
}

.message__title {
  display: flex;
  margin-bottom: 5px;
}

.message__title h4 {
  font-weight: 600;
  margin-right: 10px;
}

.message__title span {
  color: #999;
}

li.sent .message .message__body > p.wrap::after {
  content: "\2713";
  color: blue;
  float: right;
  margin: 0px 0px 0px 5px;
}

li.received .message .message__body > p.wrap::after {
  content: "\2714";
  color: green;
  float: right;
  margin: 0px 0px 0px 5px;
}

li.pending .message .message__body > p.wrap::after {
  content: "\2755";
  color: #900;
  background: red;
  border-radius: 3px;
  float: right;
  margin: 0px 0px 0px 5px;
}
.highlighted,
.highlighted:hover,
li.highlighted {
  background-color: #337ba867;
  border-radius: 10px;
}
</style>
