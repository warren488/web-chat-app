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
      <div v-if="previewData" class="linkpreview">
        <img class="linkpreview__img" :src="previewData.image" alt="" />
        <div>
          <header class="linkpreview__title">{{ previewData.title }}</header>
          <span class="linkpreview__description">{{
            previewData.description
          }}</span>
        </div>
      </div>

      <form class="form-row" @submit.prevent="sendMessage" id="message-form">
        <button
          v-if="!hasAudio && !isRecording"
          @click="toggleEmojis"
          id="emoji-button"
          type="button"
        >
          &#128578;
        </button>
        <input
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
        />
        <span
          v-if="!showImage && !hasAudio"
          @click="addFileHandler"
          class="add-photo"
          id="add-photo"
        >
          <svg
            version="1.1"
            id="Layer_2_1_"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 64 64"
            style="enable-background:new 0 0 64 64;"
            xml:space="preserve"
          >
            <g>
              <path
                d="M61.3,42.7c-1.6,0-2.7,1.1-2.7,2.7v13.3H5.3V45.3c0-1.6-1.1-2.7-2.7-2.7S0,43.7,0,45.3v15.2C0,62.4,1.9,64,4,64h56
		c2.1,0,4-1.6,4-3.5V45.3C64,43.7,62.9,42.7,61.3,42.7z"
              />
              <path
                d="M24,13.6l5.3-5.3v37.1c0,1.6,1.1,2.7,2.7,2.7c1.6,0,2.7-1.1,2.7-2.7V8.3l5.3,5.3c0.5,0.5,1.3,0.8,1.9,0.8
		c0.8,0,1.3-0.3,1.9-0.8c1.1-1.1,1.1-2.7,0-3.7l-8-8C34.9,0.8,33.3,0,32,0l0,0c-1.3,0-2.7,0.5-3.7,1.6l-8,8.3
		c-1.1,1.1-1.1,2.7,0,3.7C21.3,14.7,22.9,14.7,24,13.6z"
              />
            </g>
          </svg>

          <input
            type="file"
            @input="fileInputHandler"
            style="display: none"
            enctype="multipart/form-data"
            accept="image/*"
            ref="fileInput"
          />
        </span>

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
        <button
          v-if="hasText || hasAudio || showImage"
          ref="sendButton"
          class="transp textmessage"
          id="send-button"
        >
          <img src="../assets/send.svg" alt />
        </button>
        <div v-if="!hasText && !showImage" class="voicemessage">
          <button
            class="voicemessage__control"
            v-if="!isRecording && !hasAudio"
            id="start"
            @click="getVN"
          >
            <svg
              version="1.1"
              id="Layer_2_1_"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              viewBox="0 0 64 64"
              style="enable-background:new 0 0 64 64;"
              xml:space="preserve"
            >
              <g>
                <path
                  d="M32,45.6c3.7,0,7.2-1.3,9.6-4c2.4-2.4,3.7-5.6,3.7-9.1V13.1C45.3,5.9,39.5,0,32,0S18.7,5.9,18.7,13.1v19.7
		C18.7,39.7,24.5,45.6,32,45.6z M24,13.1c0-4.3,3.5-7.7,8-7.7s8,3.5,8,7.7v19.7c0,1.9-0.8,3.7-2.1,5.1c-1.6,1.6-3.7,2.4-5.9,2.4
		c-4.5,0-8-3.5-8-7.7V13.1z"
                />
                <path
                  d="M53.3,30.7c0-1.6-1.1-2.7-2.7-2.7c-1.6,0-2.7,1.1-2.7,2.7c0,9.1-7.2,16.5-16,16.5s-16-7.5-16-16.5c0-1.6-1.1-2.7-2.7-2.7
		s-2.7,1.1-2.7,2.7c0,11.2,8.3,20.3,18.7,21.6v6.4H24c-1.6,0-2.7,1.1-2.7,2.7c0,1.6,1.1,2.7,2.7,2.7h16c1.6,0,2.7-1.1,2.7-2.7
		c0-1.6-1.1-2.7-2.7-2.7h-5.3v-6.1C45.1,51.2,53.3,41.9,53.3,30.7z"
                />
              </g>
            </svg>
          </button>
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
  methods: {
    addEmoji(e) {
      if (e.target.dataset.value) {
        this.messageText += e.target.dataset.value;
        this.$refs.msgText.focus();
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
      let { id: friendId } = this.friends.find(
        ({ _id }) => _id === this.currChat
      );
      return uploadToFireBase(file, `/images/${this.user.id}/${friendId}`);
    },
    keydownHandler(e: KeyboardEvent) {
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

      let messageShell = {
        // server uses it's own timestamp... hmmmm
        createdAt: Date.now(),
        status: "pending",
        hID: this.highlighted
      };

      if (this.audioBlob) {
        this.$emit("newMessage", {
          type: "media",
          media: "audio",
          uploadPromise: addAudioToFirebase(this.audioBlob, this.currChat),
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
        this.messageText = "";
      } else {
        this.$emit("newMessage", {
          text: msg,
          ...messageShell
        });
        this.messageText = "";
      }
      this.$refs.msgText.focus();
    }
  },
  computed: {
    ...mapGetters(["currChat", "friends", "user"]),
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
      this.$refs.msgText.focus();
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.add-photo {
  font-size: 2rem;
  cursor: pointer;
  font-weight: bold;
  color: #e6eaee;
  min-width: 20px;
  width: 20px;
  align-self: flex-end;
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
  padding: 0px 8px;
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

.linkpreview {
  display: flex;
  border-radius: 4px;
  background: rgb(215, 219, 223);
  overflow: hidden;
  margin-bottom: 16px;

  &__img {
    width: 100px;
  }
  &__title {
    font-weight: bold;
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
    font-size: 1.25rem;
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
  font-size: 1.75rem;
}

.emojis.show {
  /* display: block; */
  min-height: 150px;
}

.d-none {
  display: none;
}
</style>
