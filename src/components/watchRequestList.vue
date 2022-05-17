<template>
  <new-modal :showModal="showModal" @close="$emit('close')">
    <template v-slot:full-replace>
      <header class="d-flex justify-content-between p-3">
        <h1>Watch Requests</h1>
        <button class="btn btn-danger" @click="clearWatchRequests">
          clear all
        </button>
      </header>
      <section>
        <ul class="list-group">
          <li
            v-for="(req, index) in sortedWatchRequests"
            :key="index + req.playlistId"
            class="list-group-item list-group-item-action"
            :data-key="index"
            @click="() => loadWatchSessionRequestHandler(req)"
          >
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">
                {{
                  friendShips.find(fs => req.friendship_id === fs._id).username
                }}
              </h5>
              <small>{{ relativeDays(req.createdAt) }}</small>
            </div>
            <p class="mb-1">
              {{
                playlists &&
                  playlists.get(req.playlistId) &&
                  playlists.get(req.playlistId).name
              }}
            </p>
            <!-- <small>And some small print.</small> -->
          </li>
        </ul>
      </section>
    </template>
  </new-modal>
</template>

<script lang="ts">
import { mapActions, mapGetters, mapMutations } from "vuex";
import newModal from "./newModal.vue";
import { relativeDays } from "@/common";
export default {
  name: "WatchRequests",
  props: ["showModal"],
  components: { newModal },
  data() {
    return {};
  },
  mounted() {
    // console.log(this.watchRequests);
  },
  methods: {
    ...mapActions(["emitEvent"]),
    ...mapMutations(["updateWatchRequests", "loadWatchSessionRequest"]),
    relativeDays,
    loadWatchSessionRequestHandler(request) {
      this.$emit("close");
      this.loadWatchSessionRequest(request);
    },
    async clearWatchRequests() {
      await this.emitEvent({ eventName: "clearWatchRequests" });
      this.updateWatchRequests([]);
    }
  },
  computed: {
    ...mapGetters(["watchRequests", "friendShips", "playlists"]),
    sortedWatchRequests() {
      const sorted = this.watchRequests;
      return (
        sorted && sorted.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
      );
    }
  }
};
</script>

<style></style>
