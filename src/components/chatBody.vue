<template>
  <div ref="messageScroll" class="chat__main">
    <div class="bg"></div>
    <button class="chat__view-more" :disabled="showLoader" @click="viewMore">
      <span v-if="showLoader">
        <loader type="ellipsis" :display="true" />
      </span>
      <span v-if="!showLoader"> View more </span>
    </button>

    <div
      class="date__group"
      v-for="[key, keyMessages] of messageMap"
      :key="key"
    >
      <ol key class="chat__messages" id="messages">
        <div v-if="!(new Date().toLocaleDateString() === key)" class="new-date">
          <span class="badge rounded-pill bg-success">{{
            new Date(Date.now() - 86400000).toLocaleDateString() === key
              ? "Yesterday"
              : key
          }}</span>
        </div>
        <li
          v-for="message of keyMessages"
          :key="message.msgId"
          :class="{
            [message.status]: true,
            me: message.fromId === user.id,
            wrap__status: message.fromId === user.id
          }"
          :id="message.msgId"
        >
          <div
            :class="{
              message: true,
              'bg-success': message.fromId === user.id,
              'text-white': message.fromId === user.id
            }"
          >
            <div
              :class="{
                message__title: true,
                light: message.fromId === user.id
              }"
            >
              <span>{{
                new Date(message.createdAt).toLocaleTimeString()
              }}</span>
              <span class="reply" @click="replyClick(message.msgId)"
                >reply</span
              >
            </div>
            <div class="message__body">
              <div :class="{ wrap: true }">
                <audio
                  class="audiomessage"
                  v-if="message.type === 'media' && message.media === 'audio'"
                  style="max-height: 100%"
                  :src="message.url"
                  controls
                ></audio>
                <linkPreview
                  v-if="message.linkPreview"
                  :previewData="message.linkPreview"
                ></linkPreview>
                <div style="display: flex; flex-direction: column">
                  <imagepreview
                    :fitToBox="true"
                    :componentLength="300"
                    v-if="message.type === 'media' && message.media === 'image'"
                    :message="message"
                  />
                  <span class="text-content" v-if="message.media !== 'audio'">
                    {{ message.text }}
                  </span>
                </div>
                <span v-if="message.quoted" class="quoted text-dark">
                  <div class="message__title">
                    <span class="sender text-dark">
                      {{
                        message.quoted.fromId === user.id
                          ? "me"
                          : message.quoted.from
                      }}
                    </span>
                    <span>
                      {{
                        new Date(message.quoted.createdAt).toLocaleTimeString()
                      }}
                    </span>
                  </div>
                  <span class="wrap">{{ message.quoted.text }}</span>
                  <audio
                    class="audiomessage"
                    v-if="
                      message.quoted.type === 'media' &&
                        message.quoted.media === 'audio'
                    "
                    :src="message.quoted.url"
                    controls
                  ></audio>
                </span>
              </div>
            </div>
          </div>
        </li>
      </ol>
    </div>

    <!-- <ol class="chat__messages" id="messages">
      <li
        v-for="(message, index) of allMessages"
        :key="message.msgId"
        :class="{
          [message.status]: true,
          me: message.fromId === user.id,
          wrap__status: message.fromId === user.id
        }"
        :id="message.msgId"
      >
        <div class="message">
          <div class="message__title">
            <span>{{ new Date(message.createdAt).toLocaleTimeString() }}</span>
            <span class="reply" @click="replyClick(message.msgId)">reply</span>
          </div>
          <div class="message__body">
            <div :class="{ wrap: true }">
              <audio
                class="audiomessage"
                v-if="message.type === 'media' && message.media === 'audio'"
                style="max-height: 100%"
                :src="message.url"
                controls
              ></audio>
              <linkPreview
                v-if="message.linkPreview"
                :previewData="message.linkPreview"
              ></linkPreview>
              <div style="display: flex; flex-direction: column">
                <imagepreview
                  :fitToBox="true"
                  :componentLength="300"
                  v-if="message.type === 'media' && message.media === 'image'"
                  :message="message"
                />
                <span class="text-content" v-if="message.media !== 'audio'">
                  {{ message.text }}
                </span>
              </div>
              <span v-if="message.quoted" class="quoted">
                <div class="message__title">
                  <span class="sender">
                    {{
                      message.quoted.fromId === user.id
                        ? "me"
                        : message.quoted.from
                    }}
                  </span>
                  <span>
                    {{
                      new Date(message.quoted.createdAt).toLocaleTimeString()
                    }}
                  </span>
                </div>
                <span class="wrap">{{ message.quoted.text }}</span>
                <audio
                  class="audiomessage"
                  v-if="
                    message.quoted.type === 'media' &&
                      message.quoted.media === 'audio'
                  "
                  :src="message.quoted.url"
                  controls
                ></audio>
              </span>
            </div>
          </div>
        </div>
        <div
          v-if="
            allMessages[index + 1] &&
              new Date(message.createdAt).toLocaleDateString() !==
                new Date(allMessages[index + 1].createdAt).toLocaleDateString()
          "
          class="new-date"
        >
          <span>{{ new Date(message.createdAt).toLocaleDateString() }}</span>
        </div>
      </li>
    </ol> -->
  </div>
</template>

<script lang="ts">
import { getCookie, scrollBottom2 } from "@/common";
interface Message {
  name: string;
  text: string;
}
import Vue from "vue";
import { mapGetters } from "vuex";
// @ts-ignore
import messageImage from "./messageImage";
// @ts-ignore
import imagepreview from "./imagepreview";
// @ts-ignore
import linkPreview from "./linkPreview";
import Loader from "./loader.vue";

export default Vue.extend({
  props: {
    frienship_id: String,
    messages: Array,
    highlighted: String,
    loadingMore: Boolean
  },
  components: { imagepreview, linkPreview, Loader },
  data() {
    return {
      timeArr: []
    };
  },
  mounted() {
    scrollBottom2({
      force: true,
      test: false,
      element: this.$refs.messageScroll,
      noAnim: true
    });

    const date = new Date(new Date().toLocaleDateString());
    const somedate = new Date(
      new Date(this.allMessages.createdAt).toLocaleDateString()
    );
    const timeArr = [date.getTime()];
    let count = 1;
    while (timeArr[0] > somedate.getTime()) {
      count++;
      timeArr.unshift(date.getTime() - 86400000 * count);
    }
    this.timeArr = timeArr;
  },
  created() {
    window.addEventListener("resize", this.resizeHandler);
  },
  beforeDestroy() {
    /** @todo does this resolve to the correct refernce even tho we used bind before? */
    window.removeEventListener("resize", this.resizeHandler);
  },
  methods: {
    resizeHandler() {
      scrollBottom2({
        force: true,
        test: false,
        element: this.$refs.messageScroll
      });
    },
    getCookie,
    replyClick(msgId: string): void {
      this.$emit("replyClick", msgId);
    },
    viewMore() {
      this.$emit("viewMore");
    }
  },
  computed: {
    showLoader() {
      return this.loadingMore;
    },
    ...mapGetters(["user"]),
    allMessages(): Array<Message> {
      return this.messages;
    },
    /** @todo could this cause performance issues? all for the date to be looking fancy? */
    messageMap() {
      const messageMap = new Map();
      for (const message of this.messages) {
        /** being fancy and not creating a new variable every loop */
        var thisDate = new Date(message.createdAt).toLocaleDateString();
        if (messageMap.get(thisDate)) {
          messageMap.get(thisDate).push(message);
        } else {
          messageMap.set(thisDate, [message]);
        }
      }

      return messageMap;
    }
  },
  updated() {
    scrollBottom2({
      force: false,
      test: false,
      element: this.$refs.messageScroll
    });
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

<style lang="scss">
.bg {
  z-index: -1;
  // background-image: url(https://firebasestorage.googleapis.com/v0/b/myapp-4f894.appspot.com/o/profileImages%2F604e20b860e2f6001718079b%2F1626573297556.jpg?alt=media&token=62152715-f3d8-4de6-81d6-6fb5c99151b6);
  // background-color: rgba(0, 0, 0, 0.2);
  // background-blend-mode: multiply;
  // background-size: cover;
  // filter: blur(3px);
  position: absolute;
  top: 0px;
  bottom: 0px;
  right: 0px;
  left: 0px;
}
.chat__main {
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  max-height: 100vh;
  overflow-y: scroll;
}
.chat__view-more {
  align-self: center;
  margin-top: 1rem;
  border: none;
  border-radius: 1.5rem;
  padding: 0.2rem 0.5rem;
}

.new-date {
  position: sticky;
  top: 0.5rem;
  display: flex;
  justify-content: center;
  flex-basis: 100%;
  * {
    background-color: lightgray;
  }
}

.chat__messages {
  list-style-type: none;
  li {
    display: flex;
    flex-wrap: wrap;
    .message {
      border-end-start-radius: 0px;
    }
  }
}

.chat__messages .me {
  justify-content: flex-end;
}

.chat__messages .me .message {
  justify-content: flex-end;
  border-end-start-radius: 1rem;
  border-bottom-left-radius: 1rem;
  border-end-end-radius: 0px;
  border-bottom-right-radius: 0px;
  .message__title {
    justify-content: flex-end;
  }
}

.audiomessage {
  height: 32px;
  max-width: 100%;
}
.reply {
  cursor: pointer;
  margin-left: 5px;
}
.quoted {
  background-color: rgb(202, 202, 202);
  display: inline-block;
  border: thin solid rgb(202, 202, 202);
  border-radius: 1rem;
  padding: 5px;
  margin-left: 5%;
  margin-top: 5px;
  width: 95%;
  box-shadow: 1px 1px 3px gray inset;
}
.chat__messages {
  -webkit-overflow-scrolling: touch;
  padding: 10px;
}
.message {
  padding: 5px;
  padding-left: 10px;
  background-color: #e6eaee;
  border-radius: 1rem;
  margin: 5px;
  max-width: 80%;
}

.message__title {
  display: flex;
  justify-content: flex-start;
  line-height: 1;
  font-size: 0.75rem;
}

.message__title .sender {
  font-weight: 600;
  margin: 0px 10px 0px 0px;
  line-height: 1;
  color: inherit;
}

.message__title {
  color: #999;
  &.light {
    color: #ddd;
  }
}

.message__body .wrap {
  overflow-wrap: break-word;
}

li.wrap__status.sent .message {
  border-right: solid thick gray;
  // &::after {
  //   content: "\2713";
  //   color: gray;
  //   float: right;
  //   margin: 0px 0px 0px 5px;
  // }
}

li.wrap__status.received .message {
  border-right: solid thick blue;

  // &::after {
  //   content: "\2713";
  //   color: blue;
  //   float: right;
  //   margin: 0px 0px 0px 5px;
  // }
}

li.wrap__status.read .message {
  border-right: solid thick var(--bs-success);
  // &::after {
  //   content: "\2714\2714";
  //   color: green;
  //   float: right;
  //   margin: 0px 2px 0px 5px;
  //   letter-spacing: -6px;
  // }
}

li.wrap__status.pending .message {
  border-right: solid thick red;
  // &::after {
  //   content: "\2755";
  //   color: #900;
  //   background: red;
  //   border-radius: 3px;
  //   float: right;
  //   margin: 0px 0px 0px 5px;
  // }
}
.highlighted,
.highlighted:hover,
li.highlighted {
  background-color: #337ba867;
  border-radius: 10px;
}
</style>
