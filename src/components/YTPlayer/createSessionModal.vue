<template>
  <new-modal :showModal="showModal" @close="$emit('close')">
    <template v-slot:full-replace>
      <div style="padding: 1rem">
        <h5 class="mb-3 h5">Select playlist</h5>
        <!-- <div class="dropdown">
          <button
            class="btn btn-success dropdown-toggle"
            type="button"
            id="playlist-dropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Choose Playlist
          </button>
          <ul class="dropdown-menu" aria-labelledby="playlist-dropdown">
            <li
              class="list-group-item"
              v-for="playlist of playlists"
              :key="playlist._id"
            >
              {{ playlist.name || "no name" }}
            </li>
          </ul>
        </div> -->
        <select
          class="form-select form-select-lg mb-3"
          name="playlist-select"
          id="playlist-select"
          v-model="selectedPlaylist"
          @input="selected"
        >
          <option selected :value="null">Choose Playlist</option>
          <option
            v-for="playlist of playlists"
            :key="playlist._id"
            :value="playlist._id"
          >
            {{ playlist.name || "no name" }}
          </option>
        </select>
        <div class="h5 text-center">OR</div>
        <div v-if="!selectedPlaylist">
          <h5 class="mb-3 h5">Create a new playlist</h5>
          <div class="input-group mb-3">
            <input
              v-model.lazy="name"
              type="text"
              name="name"
              class="form-control"
              placeholder="playlist name"
              autofocus
              required
            />
          </div>
          <div class="input-group mb-3">
            <input
              v-model.lazy="link"
              type="text"
              id="playlist-name"
              name="link"
              class="form-control"
              placeholder="paste video link"
              autofocus
              required
            />
            <button class="btn btn-success" @click="$emit('addToList', link)">
              Add to playlist
            </button>
          </div>
        </div>
        <button
          class="btn btn-success mb-3"
          @click="$emit('sendRequest', { name })"
        >
          Send Request
        </button>
        <ul class="list-group">
          <li class="list-group-item media" v-for="vid of vids" :key="vid.url">
            <link-preview :loading="true" :previewData="vid"></link-preview>
          </li>
        </ul>
      </div>
    </template>
  </new-modal>
</template>

<script>
import { getPlaylists } from "@/common";
import LinkPreview from "../linkPreview.vue";
import newModal from "../newModal.vue";
export default {
  components: { newModal, LinkPreview },
  props: ["vids", "showModal", "playlists"],
  data() {
    return { link: "", name: "", selectedPlaylist: null };
  },
  mounted() {},
  methods: {
    selected(event) {
      console.log(event.target.value);
      this.$emit("selected", event.target.value);
    }
  }
};
</script>

<style>
.list-group-item.media {
  height: 5rem;
  padding: 0px;
}
</style>
