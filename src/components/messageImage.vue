<template>
  <span class="img-container" :style="getMessageImageHeight(message.meta)">
    <!-- we check for the url because in some cases a message that is just sent by us will not 
    have the url populated until later -->
    <button
      v-if="downloadable && !loading && message.url"
      class="download-button"
      @click="downloadHandler"
    >
      download
    </button>
    <loader type="ring" :display="loading"></loader>
    <img
      class="imagemessage"
      ref="img"
      :style="getMessageImageHeight(message.meta)"
    />
  </span>
</template>
<script>
import Vue from "vue";
import loader from "./loader";
export default Vue.extend({
  props: {
    message: Object,
    type: String
  },
  mounted() {
    this.$refs.img.onload = function() {
      this.downloadable = false;
      this.loading = false;
    }.bind(this);
  },
  data() {
    return {
      loading: false,
      downloadable: true
    };
  },
  components: { loader },
  methods: {
    downloadHandler() {
      this.loading = true;
      this.$refs.img.src = this.message.url;
    },
    getMessageImageHeight(meta) {
      if (meta) {
        return {
          width: `${Math.min(meta.width, 500)}px`,
          /** get the ratio (width/height) and divide the current width by the ratio to get the height */
          height: `${Math.min(meta.width, 500) / (meta.width / meta.height)}px`,
          "max-width": `min(${Math.min(meta.width, 500)}px, 100%)`
        };
      }
    }
  }
});
</script>
<style lang="scss" scoped>
.img-container {
  position: relative;
  display: inline-block;
}
.download-button {
  position: absolute;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  padding: 16px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  &:hover {
    background: black;
  }
}
</style>
