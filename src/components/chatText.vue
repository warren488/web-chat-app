<template>
  <div>
    <div class="chat__footer">
      <form @submit.prevent="sendMessage" id="message-form">
        <button @click="toggleEmojis" id="emoji-button" type="button">
          &#128578;
        </button>
        <input
          v-if="!hasAudio && !isRecording"
          ref="msgText"
          type="text"
          id="msg-txt"
          name="message"
          placeholder="send message..."
          autocomplete="off"
          autofocus
          @keydown="$emit('typing')"
        />
        <div v-if="isRecording" style="flex-grow: 1; text-align: center">
          recording...
        </div>
        <audio
          ref="audioPlayer"
          v-if="hasAudio"
          :src="audioURL"
          controls
          id="audio"
          style="flex-grow: 1;"
        ></audio>
        <button class="transp" id="send-button">
          <img src="../assets/send.svg" alt />
        </button>
        <button
          class="voicemessage-control"
          v-if="!isRecording && !hasAudio"
          id="start"
          @click="getVN"
        >
          R
        </button>
        <button
          class="voicemessage-control"
          v-if="isRecording || hasAudio"
          @click="stopAndDeleteButtonHandler"
          id="stop"
        >
          S
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
import { getCookie, addAudioToFirebase } from "@/common";

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
      audioURL: null
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
      let msg = this.$refs.msgText ? this.$refs.msgText.value : null;
      if (!msg && this.audioBlob === null) {
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
          uploadPromise: addAudioToFirebase(this.audioBlob),
          ...messageShell
        });
        this.audioBlob = null;
        this.audioURL = null;
        this.shouldStop = false;
      } else {
        this.$emit("newMessage", {
          text: msg,
          ...messageShell
        });
        this.$refs.msgText.value = "";
      }
    }
  },
  computed: {
    hasAudio() {
      return this.audioBlob !== null;
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
.voicemessage-control {
  padding: 4px;
  cursor: pointer;
  font-size: 24px;
  background-color: #777;
  border-radius: 50%;
  width: 34px;
}

.transp {
  background: transparent;
}

.chat__footer {
  background: #e6eaee;
  padding: 10px;
  position: relative;
  display: flex;
  flex-shrink: 0;
  button {
    border: none;
  }
  form {
    flex-grow: 1;
    align-items: center;
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
