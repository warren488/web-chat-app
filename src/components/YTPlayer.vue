<template>
  <div v-if="display">
    <newModal :showModal="addLinkProp" @close="addLink = false">
      <template v-slot:full-replace>
        <div style="padding: 1rem">
          paste video link
          <input
            v-model.lazy="YTLink"
            type="text"
            name="link"
            autofocus
            required
          />
          <button @click="sendVidRequest">start watching</button>
        </div>
      </template>
    </newModal>
    <div class="in-chat-player" id="player-container" ref="player-container">
      <header
        class="banner"
        style="display: flex; background: var(--bs-success)"
      >
        <button class="btn btn-success" @click="$emit('close')">
          Close
        </button>
        <button class="btn btn-success" @click="addLink = true">
          New Video
        </button>
        <button class="btn btn-success" @click="fitPlayer">
          Fit Player
        </button>
        <button class="btn btn-success" @click="$emit('toggleChat')">
          Show chat
        </button>
      </header>
      <div id="player" @click="addLink = true">
        player
      </div>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import { eventBus } from "@/common/eventBus";
import newModal from "@/components/newModal.vue";
import { mapActions, mapGetters, mapMutations } from "vuex";
import { uuid } from "@/common";
const states = {
  GET_lINK: 0,
  PLAYING: 1
};
export default Vue.extend({
  name: "TYPlayer",
  components: { newModal },
  props: {
    display: Boolean,
    type: String,
    friendship_id: String,
    url: String
  },
  mounted() {
    //   i do this because after the first time we open the component it technically doesnt get destroyed so the
    // addLink value will be false and it wont show the modal
    this.addLink = true;
    console.log("mounted");
    if (this.friendship_id && this.url) {
      console.log(this.friendship_id, this.url);
      this.addLink = false;
      this.watchRequestHandler({
        friendship_id: this.friendship_id,
        url: this.url
      });
    }
    this.addOneTimeListener({
      customName: "YT",
      event: "watchVidRequest",
      handler: this.watchRequestHandler
    });
    this.addOneTimeListener({
      customName: "YT",
      event: "acceptedWatchRequest",
      handler: this.acceptedWatchRequestHandler
    });
    this.addOneTimeListener({
      customName: "YT",
      event: "pauseVideo",
      handler: data => {
        console.log("pauseVideo othandler");
        window.player.pauseVideo();
        window.player.seekTo(data.time);
      }
    });
    this.addOneTimeListener({
      customName: "YT",
      event: "playVideo",
      handler: data => {
        console.log("playVideo othandler");
        window.player.playVideo();
      }
    });
  },
  data() {
    return {
      //   showVideo: false,
      addLink: false,
      YTLink: "",
      player: null
    };
  },
  methods: {
    ...mapActions(["emitEvent", "addOneTimeListener", "removeOneTimeListener"]),
    ...mapMutations(["setCurrentChat"]),
    async acceptedWatchRequestHandler(data) {
      console.log("acceptedWatchRequestHandler");
      if (data.userId === this.user.id) {
        return;
      }
      if (this.player) {
        this.player.destroy();
      }
      this.setCurrentChat(data.friendship_id);
      this.startPlayer(data.url);
    },
    async watchRequestHandler(data) {
      if (data.userId === this.user.id) {
        return;
      }
      console.log(this.friendShips);
      const accept = await confirm(
        `your friend ${
          this.friendShips.find(
            friendship => friendship._id === data.friendship_id
          ).username
        } wants to watch a video with you from link: ${data.url}`
      );
      if (accept) {
        if (this.player) {
          this.player.destroy();
        }
        this.setCurrentChat(data.friendship_id);
        this.startPlayer(data.url);
        this.emitEvent({
          eventName: "acceptWatchRequest",
          data: { ...data, userId: this.user.id }
        });
      } else {
        this.exit();
      }
    },
    sendVidRequest(customLink) {
      console.log(this.currChatFriendshipId + "");
      this.emitEvent({
        eventName: "watchVidRequest",
        data: {
          url: typeof customLink === "string" ? link : this.YTLink,
          start: 0,
          friendship_id: this.currChatFriendshipId,
          userId: this.user.id,
          uuid: uuid()
        }
      });
    },
    startPlayer(link) {
      let vidId;
      try {
        console.log(typeof link === "string" ? link : this.YTLink);
        let url = new URL(typeof link === "string" ? link : this.YTLink);
        if (url.hostname === "www.youtube.com") {
          vidId = url.searchParams.get("v");
        } else if (url.hostname === "youtu.be") {
          vidId = url.pathname.substr(1);
        } else {
          return;
        }
        console.log(url);
      } catch (e) {
        console.log(e);
      }

      if (!vidId) {
        return;
      }
      //   this.showVideo = true;
      this.addLink = false;
      setTimeout(() => {
        // @ts-ignore
        window.player = new window.YT.Player("player", {
          height: "390",
          width: "640",
          videoId: vidId,
          playerVars: {
            playsinline: 1,
            enablejsapi: 1
          },
          events: {
            onReady: event => {
              // NB: for whatever reason this is the only version of 'player' that has the function
              window.player = event.target;
              this.player = event.target;
              console.log(event);
              console.log(window.player);
            },
            onStateChange: ({ target, data }) => {
              console.log("statechanged", data, target);
              if (data === 2) {
                this.emitEvent({
                  eventName: "pauseVideo",
                  data: {
                    time: target.playerInfo.currentTime,
                    friendship_id: this.currChatFriendshipId
                  }
                });
              } else if (data === 1) {
                this.emitEvent({
                  eventName: "playVideo",
                  data: {
                    time: target.playerInfo.currentTime,
                    friendship_id: this.currChatFriendshipId
                  }
                });
              }
            }
          }
        });
      }, 500);
    },
    exit() {
      this.$emit("close");
      this.player.destroy();
      // the call to destroy also deletes the container element so
      // we need to restore it so we can watch videos again
      let newPlayerDiv = document.createElement("div");
      newPlayerDiv.id = "player";
      this.$refs.playerContainer.$el.appendChild(newPlayerDiv);
    },
    fitPlayer() {
      document.getElementById("player").width =
        document.documentElement.clientWidth;
      document.getElementById("player").height = Math.min(
        document.documentElement.clientHeight,
        document.documentElement.clientWidth / 2
      );
    }
  },
  computed: {
    ...mapGetters(["currChatFriendshipId", "user", "friendShips"]),
    addLinkProp() {
      return this.addLink;
    }
  },
  destroyed() {
    // TODO: I should also remove playvideo and pausevideo but those wont cause any harm
    this.removeOneTimeListener({ event: "watchVidRequest", customName: "YT" });
    this.removeOneTimeListener({
      event: "acceptedWatchRequest",
      customName: "YT"
    });
  }
});
</script>
<style lang="scss" scoped>
.banner {
  background: white;
}
.in-chat-player {
  position: fixed;
  top: 0;
  //   bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
}
</style>
