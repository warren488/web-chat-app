<template>
  <div>
    <div class="chat__footer">
      <div :class="{ imgpreview: true, 'd-none': !showImage }">
        <img class="imgpreview__img" ref="imgpreview" src="" alt="" />
        <span class="imgpreview__close" @click="cancelFileSend">X</span>
      </div>
      <div :class="{ replypreview: true, 'd-none': highlighted === null }">
        <span class="replypreview__text">{{ replyText }}</span>

        <button
          type="button"
          :class="{ 'no-show': highlighted === null }"
          @click="$emit('cancelReply')"
          class="cancel-reply"
        >
          <img src="../assets/close.svg" alt />
        </button>
      </div>
      <linkPreview :previewData="previewData"></linkPreview>
      <form class="form-row" @submit.prevent="sendMessage" id="message-form">
        <md-button
          class="md-icon-button"
          :md-ripple="false"
          v-if="!hasAudio && !isRecording"
          @click="toggleEmojis"
          id="emoji-button"
        >
          <md-icon>insert_emoticon</md-icon>
        </md-button>

        <!-- <input
          v-if="!hasAudio && !isRecording"
          ref="msgText"
          type="text"
          class="msg-txt no-scrollbar"
          @keydown="keydownHandler"
          @input="scanForLink"
          id="msg-txt"
          v-model="messageText"
          name="message"
          placeholder="send message..."
          autocomplete="off"
          autofocus
        /> -->
        <md-field class="no-space" ref="field">
          <md-textarea
            ref="msgText"
            v-if="!hasAudio && !isRecording"
            @keydown="keydownHandler"
            @input="scanForLink"
            id="msg-txt"
            v-model="messageText"
            name="message"
            placeholder="send message..."
            md-autogrow
          ></md-textarea>
        </md-field>

        <div v-if="isRecording" style="flex-grow: 1; text-align: center">
          recording...
        </div>
        <audio
          class="voicemessage-player"
          ref="audioPlayer"
          v-if="hasAudio"
          :src="audioURL"
          controls
          id="audio"
          style="flex-grow: 1;"
        ></audio>
        <!-- <button
          v-if="hasText || hasAudio || showImage"
          ref="sendButton"
          class="transp textmessage"
          id="send-button"
        >
          <img src="../assets/send.svg" alt />
        </button> -->
        <md-button
          v-if="!showImage && !hasAudio"
          @click="addFileHandler"
          class="add-photo"
          id="add-photo"
        >
          <md-icon>share</md-icon>
        </md-button>
        <md-button
          type="submit"
          class="md-icon-button"
          v-if="hasText || hasAudio || showImage"
          ref="sendButton"
          id="send-button"
        >
          <md-icon>send</md-icon>
        </md-button>
        <div v-if="!hasText && !showImage" class="voicemessage">
          <md-button
            type="submit"
            class="md-icon-button"
            v-if="!isRecording && !hasAudio"
            id="start"
            @click="getVN"
          >
            <md-icon>mic</md-icon>
          </md-button>
          <md-button
            class="md-icon-button"
            v-if="isRecording || hasAudio"
            @click="stopAndDeleteButtonHandler"
            id="stop"
          >
            <md-icon>stop</md-icon>
          </md-button>
          <button
            class="voicemessage__control"
            v-if="isRecording || hasAudio"
            @click="stopAndDeleteButtonHandler"
            id="stop"
          >
            <svg
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              viewBox="0 0 64 64"
              style="enable-background:new 0 0 64 64;"
              xml:space="preserve"
            >
              <path
                d="M61.3,0H2.7C1.1,0,0,1.1,0,2.7v58.7C0,62.9,1.1,64,2.7,64h58.7c1.6,0,2.7-1.1,2.7-2.7V2.7C64,1.1,62.9,0,61.3,0z M58.7,58.7
	H5.3V5.3h53.3V58.7z"
              />
            </svg>
          </button>
        </div>
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
import {
  getCookie,
  addAudioToFirebase,
  uploadToFireBase,
  getPreviewData
} from "@/common";
import { mapGetters, mapActions, mapMutations } from "vuex";
// @ts-ignore
import linkPreview from "./linkPreview";

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
      ],
      shouldStop: false,
      isRecording: false,
      audioBlob: null,
      previewData: null,
      audioURL: null,
      file: null,
      messageText: ""
    };
  },
  props: {
    highlighted: String,
    typing: {}
  },
  components: { linkPreview },
  methods: {
    addEmoji(e) {
      if (e.target.dataset.value) {
        this.messageText += e.target.dataset.value;
        this.$refs.msgText.$el.focus();
      }
    },
    stopRecording() {
      this.shouldStop = true;
    },
    resetRecordingData() {
      this.shouldStop = false;
      this.audioBlob = null;
      this.audioURL = null;
    },
    stopAndDeleteButtonHandler() {
      if (!this.shouldStop) {
        this.stopRecording();
      } else {
        this.resetRecordingData();
      }
    },
    async fileInput(file) {
      let { friendId } = this.friendShips.find(
        ({ _id }) => _id === this.currChatFriendshipId
      );
      return uploadToFireBase(file, `/images/${this.user.id}/${friendId}`);
    },
    keydownHandler(e: KeyboardEvent) {
      if (e.code === "Enter") {
        e.preventDefault();
        this.sendMessage();
      }
      this.$emit("typing");
    },
    scanForLink() {
      let urlMatches = this.$refs.msgText.value.match(
        // eslint-disable-next-line no-useless-escape
        /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
      );
      if (urlMatches) {
        if (!this.previewData || urlMatches[0] !== this.previewData.url) {
          getPreviewData(urlMatches[0]).then(data => {
            if ("title" in data || "image" in data || "description" in data) {
              this.previewData = data;
            }
          });
        }
      } else {
        this.previewData = null;
      }
    },
    addFileHandler() {
      this.$refs.fileInput.click();
    },
    fileInputHandler() {
      this.file = this.$refs.fileInput.files[0];
      var imgpreview = this.$refs.imgpreview as HTMLImageElement;
      imgpreview.src = URL.createObjectURL(this.file);
      imgpreview.onload = function() {
        URL.revokeObjectURL(imgpreview.src); // free memory
      };
    },
    cancelFileSend() {
      this.file = null;
      this.$refs.imgpreview ? (this.$refs.imgpreview.src = "") : null;
      this.$refs.fileInput ? (this.$refs.fileInput.value = "") : null;
    },
    getVN() {
      this.shouldStop = false;
      this.isRecording = true;
      let stopped = false;
      const audioEl = document.getElementById("audio") as HTMLAudioElement;

      const handleSuccess = stream => {
        const options = { audioBitsPerSecond: 9000, mimeType: "audio/webm" };
        const recordedChunks = [];
        // @ts-ignore
        const mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.addEventListener("dataavailable", e => {
          if (e.data.size > 0) {
            recordedChunks.push(e.data);
          }

          if (this.shouldStop === true && stopped === false) {
            mediaRecorder.stop();
            stopped = true;
          }
        });

        mediaRecorder.addEventListener("stop", () => {
          this.audioBlob = new Blob(recordedChunks);
          this.audioURL = URL.createObjectURL(this.audioBlob);
          this.isRecording = false;
          stream.getTracks().forEach(function(track) {
            track.stop();
          });
        });

        mediaRecorder.start(50);
      };

      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(handleSuccess)
        .catch(console.log);
    },
    toggleEmojis() {
      this.$refs.emojis.classList.toggle("show");
    },
    sendMessage() {
      let msg = this.$refs.msgText ? this.messageText : null;
      if (!msg && this.audioBlob === null && this.file === null) {
        return;
      }

      let messageShell: any = {
        // server uses it's own timestamp... hmmmm
        createdAt: Date.now(),
        status: "pending",
        hID: this.highlighted
      };

      if (this.previewData) {
        messageShell.linkPreview = this.previewData;
      }

      if (this.audioBlob) {
        this.$emit("newMessage", {
          type: "media",
          media: "audio",
          uploadPromise: addAudioToFirebase(
            this.audioBlob,
            this.currChatFriendshipId
          ),
          ...messageShell
        });
        this.resetRecordingData();
      } else if (this.file) {
        let imgInput = this.$refs.imgpreview;

        this.$emit("newMessage", {
          type: "media",
          media: "image",
          text: msg,
          meta: {
            height: imgInput.naturalHeight,
            width: imgInput.naturalWidth
          },
          uploadPromise: this.fileInput(this.file),
          ...messageShell
        });
        this.cancelFileSend();
      } else {
        console.log("sdsd");

        this.$emit("newMessage", {
          text: msg,
          ...messageShell
        });
      }
      this.messageText = "";
      console.log(this.$refs.msgText.$el);
      this.$refs.msgText.$el.focus();
      this.previewData = null;
    }
  },
  computed: {
    ...mapGetters(["currChatFriendshipId", "friendShips", "user"]),
    hasAudio() {
      return this.audioBlob !== null;
    },
    hasText() {
      return this.messageText && this.messageText.trim() !== "";
    },
    showImage() {
      return this.file !== null;
    },
    replyText() {
      /** @todo completely revamp this implementation now that we have better searching algo, for finding our messages then we simply
       * need to use the ID to search for the message in the application state
       */
      let element = document.getElementById(this.highlighted);
      if (!element) {
        return "";
      }
      let message = element.querySelector(".message__body .wrap");
      if (message) {
        return message.innerHTML;
      } else {
        return "";
      }
    }
  },
  watch: {
    highlighted() {
      this.$refs.msgText.$el.focus();
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import url("https://fonts.googleapis.com/css?family=Material+Icons");

.no-space {
  padding: 0px;
  margin: 0px;
  min-height: unset;
  &::before,
  &::after {
    display: none;
  }
}

.add-photo {
  display: flex;
  align-items: flex-end;
  min-width: 20px;
  width: 20px;
  height: 24px;
  font-size: 2rem;
  cursor: pointer;
  font-weight: bold;
  color: #e6eaee;
  background-color: transparent;
}
.imgpreview {
  position: relative;
}
.imgpreview__img {
  max-width: 100%;
  /** @todo this calculation is random, it works BUt should be addressed */
  max-height: calc(100vh - 275px);
}

.imgpreview__close {
  width: 32px;
  height: 32px;
  cursor: pointer;
  border-radius: 50%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  top: 8px;
  right: 8px;
  position: absolute;
  font-weight: bold;
  color: white;
  background-color: rgba(0, 0, 0, 0.3);
}
.no-scrollbar {
  // overflow-y: scroll;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */

  &::-webkit-scrollbar {
    /* WebKit */
    width: 0px;
  }
}

.form-row {
  align-self: stretch;
  background-color: white;
  border-radius: 21px;
  padding: 8px 8px;
}

.voicemessage {
  margin-left: 4px;
}

.voicemessage-player {
  // width: 100%;
  flex-grow: 1;
  min-width: 40px;
  border-radius: 32px;
  margin-right: 0.5rem;
}
.voicemessage__control {
  padding: 0px;
  display: flex;
  cursor: pointer;
  font-size: 24px;
  background-color: transparent;
  svg {
    width: 24px;
  }
}

.transp {
  background: transparent;
}

.chat__footer {
  background: #e6eaee;
  padding: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  button {
    border: none;
  }
  form {
    flex-grow: 1;
    align-items: center;
    display: flex;
    position: relative;
  }
  .msg-txt {
    background-color: white;
    min-width: 80px;
    border: none;
    font-size: 1.5rem;
    flex-grow: 1;
    &:focus {
      outline: none;
    }
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

.replypreview {
  display: flex;
  flex-wrap: nowrap;
  max-width: 100%;
  min-width: 85%;
}
.replypreview__text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  margin-right: 8px;
}

.textmessage {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px;
  margin: 4px;
  img {
    width: 24px;
    margin: 0px;
  }
}
.cancel-reply {
  cursor: pointer;
  transition: width 0.5s;
  min-width: 16px;
  padding: 0px;
  background-color: transparent;
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
  display: flex;
  flex-wrap: wrap;
  overflow-y: scroll;
  cursor: pointer;
  height: 0px;
  min-height: 0px;
}

.emojis span {
  display: inline-block;
  font-family: "Font Awesome 5 Free";
  font-size: 2rem;
  padding: 0.25rem;
}

.emojis.show {
  padding: 0.75rem;
  min-height: 150px;
}

.d-none {
  display: none;
}
</style>
