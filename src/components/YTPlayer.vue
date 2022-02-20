<template>
  <div v-if="display">
    <newModal :showModal="addLink" @close="addLink = false">
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
    <div class="in-chat-player">
      <header class="banner" @click="$emit('close')">Close</header>
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
const states = {
  GET_lINK: 0,
  PLAYING: 1
};
export default Vue.extend({
  name: "TYPlayer",
  components: { newModal },
  props: {
    display: Boolean,
    type: String
  },
  mounted() {
    //   i do this because after the first time we open the component it technically doesnt get destroyed so the
    // addLink value will be false and it wont show the modal
    this.addLink = true;
    console.log("mounted");
    this.addOneTimeListener({
      customName: "YT",
      event: "watchVidRequest",
      handler: data => {
        console.log("othandler");
        this.setCurrentChat(data.friendship_id);
        this.startPlayer(data.url);
      }
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
      addLink: true,
      YTLink: ""
    };
  },
  methods: {
    ...mapActions(["emitEvent", "addOneTimeListener"]),
    ...mapMutations(["setCurrentChat"]),
    sendVidRequest(customLink) {
      console.log(this.currChatFriendshipId + "");
      this.emitEvent({
        eventName: "watchVidRequest",
        data: {
          url: typeof customLink === "string" ? link : this.YTLink,
          start: 0,
          friendship_id: this.currChatFriendshipId,
          userId: this.user.id
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
    }
  },
  computed: {
    ...mapGetters(["currChatFriendshipId", "user"])
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
