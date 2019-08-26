<template>
  <div class="chat__main">
    <ol class="chat__messages" id="messages">
      <li
        v-for="(message, i) of allMessages"
        :key="i"
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
            <p class="reply" @click="replyClick(this)">reply</p>
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
                <span>{{
                  new Date(message.createdAt).toLocaleTimeString()
                }}</span>
              </div>
              <p class="wrap">{{ message.quoted.text }}</p>
            </span>
          </div>
        </div>
      </li>
    </ol>
  </div>
  <!-- <li class="{{#equal ../username from 'is' }}{{status}} {{/equal}} {{#equal ../username from 'is' }}me{{/equal}}"
                id='{{_id}}'>
                <div class="message">
                    <div class='message__title'>
                        <h4>{{#equal ../username from 'is' }}me{{/equal}}{{#equal ../username from 'not' }}{{from}}{{/equal}}
                        </h4>
                        <span>{{createdAt}}</span>
                        <p class='reply' onclick="replyClick(this)">reply</p>
                    </div>
                    <div class="message__body">
                        <p class="wrap">{{text}}</p>
                        {{#if quoted}}
                        {{#quoted}}
                        <span class="quoted">
                            <div class='message__title'>
                                <h4>{{#equal ../../username from 'is' }}me{{/equal}}{{#equal ../../username from 'not' }}{{from}}{{/equal}}
                                </h4>
                                <span>{{createdAt}}</span>
                            </div>
                            <p class="wrap">{{text}}</p>
                        </span>
                        {{/quoted}}
                        {{/if}}
                    </div>

                </div>
  </li>-->
</template>

<script lang="ts">
import { getCookie, getMessages } from "@/common";
interface Message {
  name: String;
  text: String;
}
import Vue from "vue";

export default Vue.extend({
  props: {
    frienship_id: String,
    messages: Array
  },
  data() {
    return {};
  },
  created() {},
  methods: {
    getCookie
  },
  computed: {
    allMessages(): Array<Message> {
      return this.messages;
    }
  }
});
</script>

<style>
.chat__main {
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
  overflow-y: scroll;
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

li[id=""].pending .message .message__body > p.wrap::after {
  content: "\2755";
  color: #900;
  background: red;
  border-radius: 3px;
  float: right;
  margin: 0px 0px 0px 5px;
}
</style>
