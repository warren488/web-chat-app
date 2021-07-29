<template>
  <span
    class="full-container"
    :style="{
      '--full-width': `${componentLength}px`,
      '--full-height': `${componentLength}px`
    }"
  >
    <!-- we check for the url because in some cases a message that is just sent by us will not 
    have the url populated until later -->
    <button
      v-if="downloadable && !loading && message.url"
      class="download-button"
      @click.stop="downloadHandler"
    >
      download
    </button>
    <viewImageModal
      ref="imgModal"
      :width="fullPageWidth"
      :height="fullPageHeight"
      :src="loadedSrc"
      :showModal="isOpen"
      @close="close"
      :alt="'profile picture'"
    />
    <loader type="ring" :display="loading"></loader>
    <span ref="imgcontainer">
      <img
        class="imagemessage"
        @click="open"
        ref="img"
        :style="{
          '--image-height': getMessageImageHeight(message.meta).height,
          '--image-width': getMessageImageHeight(message.meta).width
        }"
      />
    </span>
  </span>
</template>
<script lang="ts">
import { getDimensionsForBox } from "@/common";
import Vue from "vue";
import loader from "./loader.vue";
import viewImageModal from "./viewImageModal.vue";

export default Vue.extend({
  components: {
    viewImageModal,
    loader
  },
  props: {
    message: Object,
    componentLength: Number,
    fitToBox: Boolean
  },
  mounted() {
    this.$refs.img.onload = function() {
      this.downloadable = false;
      // we dont want to waste bandwidth by passing in the url and making the image load
      this.loadedSrc = this.message.url;
      this.loading = false;
    }.bind(this);
  },
  data() {
    return {
      isOpen: false,
      loading: false,
      downloadable: true,
      loadedSrc: "",
      fullPageWidth: null,
      fullPageHeight: null
    };
  },
  methods: {
    downloadHandler() {
      this.loading = true;
      this.$refs.img.src = this.message.url;
    },

    close() {
      console.log("close");
      this.isOpen = false;
    },
    open() {
      let dimensions = getDimensionsForBox({
        containerWidth: window.innerWidth * 0.85,
        containerHeight: window.innerHeight * 0.85,
        objectWidth: this.message.meta.width,
        objectHeight: this.message.meta.height
      }) as Map<String, Number>;
      this.fullPageWidth = dimensions.get("width");
      this.fullPageHeight = dimensions.get("height");
      this.isOpen = true;
    },
    getMessageImageHeight(meta) {
      if (this.fitToBox) {
        let propertyMap = getDimensionsForBox({
          containerWidth: this.componentLength,
          objectWidth: this.message.meta.width,
          objectHeight: this.message.meta.height
        });
        return {
          width: `${propertyMap.get("width")}px`,
          height: `${propertyMap.get("height")}px`
        };
      } else {
        return {};
      }
    }
  }
});
</script>
<style lang="scss" scoped>
.full-container {
  width: var(--full-width);
  height: var(--full-height);
  max-width: 100%;
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.imagemessage {
  cursor: pointer;
  top: auto;
  left: auto;
  transition: width 0.3s, height 0.3s, top 0.3s, left 0.3s, transform 0.3s ease;
  width: var(--image-width);
  height: var(--image-height);
}

.activeimage {
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.5);
  .imagemessage {
    z-index: 1100;
    position: fixed;
    top: 50%;
    left: 50%;
  }
  overflow: visible;
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
