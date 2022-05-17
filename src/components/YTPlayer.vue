<template>
  <div v-if="display">
    <!-- the reason for both close and closed is that the modal leaves residual elements if we 
   dont wait for it to fully close, so we tell it to close first before running the rest of the important close stuff -->
    <create-session-modal
      :showModal="addLinkProp"
      @close="addLink = false"
      @closed="!activeYTSession ? exit() : null"
      @sendRequest="sendWatchRequest"
      @addToList="addToList"
      :vids="vids"
      :playlists="playlists"
      @selected="selectedPlaylist"
    ></create-session-modal>
    <new-modal
      :showModal="!!pendingWatchRequest"
      :confirm="true"
      :header="'Watch session request'"
      :text="modalText"
      @accept="acceptWatchRequest"
      @deny="denyWatchRequest"
    >
      <template v-if="pendingWatchRequest" v-slot:body>
        <link-preview
          v-for="vid of pendingWatchRequest.vids"
          :key="vid.url"
          :previewData="vid"
        >
        </link-preview>
      </template>
    </new-modal>
    <!-- </div> -->
    <div class="in-chat-player" id="player-container" ref="playerContainer">
      <header
        class="banner"
        style="display: flex; background: var(--bs-success)"
        v-if="activeYTSession"
        ref="YTHeader"
      >
        <button class="btn btn-success" @click="exit">Close</button>
        <button class="btn btn-success" @click="addLink = true">
          New Session
        </button>
        <button class="btn btn-success" @click="fitPlayer">Fit Player</button>
        <button class="btn btn-success" @click="$emit('toggleChat')">
          Show chat
        </button>
        <div class="btn-group dropdown" v-if="playlist">
          <button
            class="btn btn-success dropdown-toggle"
            type="button"
            id="playlist-dropdown"
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
            aria-expanded="false"
          >
            Playlist
          </button>
          <ul
            class="dropdown-menu playlist"
            aria-labelledby="playlist-dropdown"
          >
            <li
              class="dropdown-item disabled"
              style="min-width: 400px"
              v-for="vid of playlist.vids"
              :key="vid.url"
            >
              <link-preview :previewData="vid"></link-preview>
            </li>
            <li class="dropdown-item-text">
              <div class="input-group mb-3">
                <!-- <div class="form-control"> -->
                <input
                  v-model.lazy="newLinkUrl"
                  type="text"
                  placeholder="add video"
                  class="form-control"
                  @input="newLinkInputDebounced"
                />
                <button @click="addToCreatedList" class="btn btn-success">
                  +
                </button>
                <!-- </div> -->
              </div>
              <link-preview
                :loading="loadingPreview"
                :previewData="newLinkPreviewData"
              ></link-preview>
            </li>
          </ul>
        </div>
      </header>
      <div id="player" @click="addLink = true"></div>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import { debounce } from "debounce";
import newModal from "@/components/newModal.vue";
import { mapActions, mapGetters, mapMutations } from "vuex";
import { getPlaylists, getPreviewData, uuid } from "@/common";
import LinkPreview from "./linkPreview.vue";
import CreateSessionModal from "./YTPlayer/createSessionModal.vue";
const states = {
  GET_lINK: 0,
  PLAYING: 1
};
export default Vue.extend({
  name: "TYPlayer",
  components: { newModal, LinkPreview, CreateSessionModal },
  props: {
    display: Boolean,
    CreateSessionModal,
    type: String
  },
  created() {
    this.newLinkInputDebounced = debounce(this.newLinkInput, 500);
  },
  mounted() {
    //   i do this because after the first time we open the component it technically doesnt get destroyed so the
    // addLink value will be false and it wont show the modal
    this.addLink = true;
    this.addOneTimeListener({
      customName: "YT",
      event: "acceptedWatchRequest",
      handler: this.acceptedWatchRequestHandler
    });
    this.addOneTimeListener({
      customName: "YT",
      event: "pauseVideo",
      handler: data => {
        window.player.pauseVideo();
        window.player.seekTo(data.time);
      }
    });
    this.addOneTimeListener({
      customName: "YT",
      event: "playListUpdated",
      handler: data => {
        if (this.playlist._id === data._id) {
          this.playlist = data;
        }
      }
    });
    this.addOneTimeListener({
      customName: "YT",
      event: "playVideo",
      handler: data => {
        window.player.playVideo();
      }
    });
    this.enablePopupNotif();
  },
  data() {
    return {
      addLink: false,
      newLinkPreviewData: null,
      loadingPreview: false,
      player: null,
      vids: [],
      playlistName: "",
      playlist: null,
      currentIndex: 0,
      selectedPlaylistId: "",
      newLinkUrl: ""
    };
  },
  methods: {
    ...mapActions([
      "emitEvent",
      "addOneTimeListener",
      "setCurrentChat",
      "removeOneTimeListener"
    ]),
    ...mapMutations([
      "enablePopupNotif",
      "clearPendingWatchRequest",
      "disablePopupNotif",
      "addPlaylist",
      "enterYTSession",
      "leaveYTSession"
    ]),
    async newLinkInput(event) {
      try {
        this.loadingPreview = true;
        // TODO: check the specs for the input event to see if there's a better way to do this
        this.newLinkUrl = event.target.value;
        let previewData = await getPreviewData(event.target.value);
        if (previewData.message == "error") {
          this.newLinkPreviewData = null;
        } else {
          this.newLinkPreviewData = previewData;
        }
        this.loadingPreview = false;
        return true;
      } catch (error) {
        this.loadingPreview = false;
        return true;
      }
    },
    async addToCreatedList({ listId, url }) {
      if (!this.newLinkUrl) {
        return;
      }
      let previewData = await getPreviewData(this.newLinkUrl);
      let newPlaylist = await this.emitEvent({
        eventName: "addVideoToPlaylist",
        data: {
          listId: this.playlist._id,
          // NB: this (for now) will serve to tell the server that we are watching this playlist with someone so update their list as well
          friendship_id: this.currChatFriendshipId,
          vid: previewData
        }
      });
      this.playlist = newPlaylist;
    },
    selectedPlaylist(listId) {
      if (listId) {
        this.vids = this.playlists.get(listId).vids;
        this.selectedPlaylistId = listId;
      } else {
        this.vids = [];
        this.selectedPlaylistId = "";
      }
    },
    async addToList(link) {
      if (!link) {
        return;
      }
      let index = this.vids.push({ url: link }) - 1;
      getPreviewData(link).then(data => {
        this.vids.splice(index, 1, data);
      });
    },
    async acceptedWatchRequestHandler(data) {
      // TODO: in the future we should add a way for us to confirm that we're ready?
      if (data.userId === this.user.id) {
        return;
      }
      this.enterYTSession(data.friendship_id);
      this.playlist = data;
      this.currentIndex = 0;
      if (this.player) {
        this.player.destroy();
      }
      this.setCurrentChat(data.friendship_id);
      this.startPlayer(this.playlist.vids[0].url);
    },
    async acceptWatchRequest() {
      if (this.player) {
        this.player.destroy();
      }
      this.playlist = this.pendingWatchRequest;
      this.enterYTSession(this.playlist.friendship_id);
      this.clearPendingWatchRequest();
      this.setCurrentChat(this.playlist.friendship_id);
      this.startPlayer(this.playlist.vids[0].url);
      this.emitEvent({
        eventName: "acceptWatchRequest",
        data: { ...this.playlist, userId: this.user.id }
      });
    },
    async denyWatchRequest() {
      this.clearPendingWatchRequest();
      this.emitEvent({
        eventName: "denyWatchRequest",
        data: { ...this.pendingWatchRequest, userId: this.user.id }
      });
      this.exit();
    },
    sendWatchRequest(data) {
      if (this.vids.length === 0) {
        return;
      }
      let playlist = {
        from: this.user.id,
        friendship_id: this.currChatFriendshipId,
        uuid: uuid(),
        to: this.friendShips.find(
          friendship => friendship._id === this.currChatFriendshipId
        ).friendId
      };
      if (this.selectedPlaylistId) {
        playlist.playlistId = this.selectedPlaylistId;
      } else {
        playlist.vids = this.vids;
        playlist.name = data.name;
      }
      this.emitEvent({
        eventName: "watchSessRequest",
        data: playlist
      });
      this.addPlaylist(playlist);
    },
    startPlayer(link) {
      let vidId;
      try {
        let url = new URL(link);
        if (url.hostname === "www.youtube.com") {
          vidId = url.searchParams.get("v");
        } else if (url.hostname === "youtu.be") {
          vidId = url.pathname.substr(1);
        } else {
          return;
        }
      } catch (e) {
        console.log(e);
      }

      if (!vidId) {
        return;
      }
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
              this.fitPlayer();
            },
            onStateChange: ({ target, data }) => {
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
              } else if (data === 0) {
                // this.emitEvent({
                //   eventName: "playVideo",
                //   data: {
                //     time: target.playerInfo.currentTime,
                //     friendship_id: this.currChatFriendshipId
                //   }
                // });
                if (this.playlist.vids[++this.currentIndex]) {
                  this.player.destroy();
                  this.startPlayer(this.playlist.vids[++this.currentIndex].url);
                }
              }
            }
          }
        });
      }, 500);
    },
    exit() {
      console.log("exiting");
      if (this.player) {
        this.player.destroy();
      }
      // the call to destroy also deletes the container element so
      // we need to restore it so we can watch videos again
      let newPlayerDiv = document.createElement("div");
      newPlayerDiv.id = "player";
      this.$refs.playerContainer.appendChild(newPlayerDiv);
      this.leaveYTSession(this.YTSessionFriendId);
      // even though we destroy the whole container the modal still leaves residue if its not told explicitly to close
      this.addLink = false;
      this.$emit("close");
    },
    fitPlayer() {
      const headerHeight = this.$refs.YTHeader
        ? this.$refs.YTHeader.offsetHeight
        : 0;
      document.getElementById("player").width =
        document.documentElement.clientWidth;
      document.getElementById("player").height = Math.min(
        document.documentElement.clientHeight - headerHeight,
        document.documentElement.clientWidth / 2
      );
    }
  },
  computed: {
    ...mapGetters([
      "currChatFriendshipId",
      "user",
      "friendShips",
      "activeYTSession",
      "YTSessionFriendId",
      "playlists",
      "pendingWatchRequest"
    ]),
    addLinkProp() {
      return this.addLink;
    },
    modalText() {
      return this.pendingWatchRequest
        ? `your friend ${
            this.friendShips.find(
              friendship =>
                friendship._id === this.pendingWatchRequest.friendship_id
            ).username
          }  wants to watch YouTube with you`
        : "";
    }
  },
  destroyed() {
    // TODO: I should also remove playvideo and pausevideo but those wont cause any harm
    this.removeOneTimeListener({
      event: "acceptedWatchRequest",
      customName: "YT"
    });
    this.disablePopupNotif();
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
.list-group-item {
  height: 5rem;
  padding: 0px;
}

.dropdown-menu.playlist {
  max-height: 70vh;
  overflow-y: scroll;
}

.playlist-item {
  max-height: 5rem;
}
</style>
