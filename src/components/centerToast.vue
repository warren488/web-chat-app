<template>
  <!-- FIXME: send in the id to avoid issues -->
  <div
    id="center-toast"
    class="toast position-absolute top-0 end-0 hide fw-bold m-3"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    <div class="toast-body" v-if="pendingWatchRequest">
      New video watch request from
      {{
        //   @ts-ignore
        friendShips.find(
          friend => friend.friendId === pendingWatchRequest.fromId
        ).username
      }}
      <div class="mt-2 pt-2 border-top">
        <button
          type="button"
          class="btn btn-primary btn-sm me-1"
          @click="loadWatchSessionRequestHandler"
        >
          View Request
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          data-bs-dismiss="toast"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getUserById } from "@/common";
import { mapGetters, mapMutations } from "vuex";
export default {
  methods: {
    ...mapMutations(["loadWatchSessionRequest"]),
    getUserById,
    loadWatchSessionRequestHandler() {
      // close this
      //   this.$emit("close");
      this.loadWatchSessionRequest(this.pendingWatchRequest);
    }
  },
  computed: {
    ...mapGetters(["pendingWatchRequest", "friendShips"])
  }
};
</script>

<style></style>
