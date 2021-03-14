<template>
  <span
    class="full-container"
    @click="() => (isOpen ? close() : open())"
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
    <loader type="ring" :display="loading"></loader>
    <span ref="imgcontainer">
      <img
        class="imagemessage"
        ref="img"
        :style="{
          '--image-height': getMessageImageHeight(message.meta).height,
          '--image-width': getMessageImageHeight(message.meta).width
        }"
      />
    </span>
  </span>
</template>
<script>
import Vue from "vue";
import loader from "./loader";
export default Vue.extend({
  props: {
    message: Object,
    componentLength: Number,
    fitToBox: Boolean
  },
  mounted() {
    this.$refs.img.onload = function() {
      this.downloadable = false;
      this.loading = false;
    }.bind(this);
  },
  data() {
    return {
      isOpen: false,
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
    close() {
      this.$refs.img.style.transform = ``;
      this.$refs.imgcontainer.classList.remove("activeimage");
      this.isOpen = false;
    },
    open() {
      let dimensions = this.getDimensionsForBox(
        window.innerWidth * 0.85,
        window.innerHeight * 0.85
      );
      let coords = this.$refs.img.getBoundingClientRect();
      let scale = dimensions.get("width") / coords.width;
      this.$refs.img.style.transform = `translate(-50%, -50%)scale(${scale})`;
      this.$refs.imgcontainer.classList.add("activeimage");
      this.isOpen = true;
    },
    getDimensionsForBox(length, height) {
      let WHRatio = this.message.meta.width / this.message.meta.height;
      let propertyMap = new Map();
      /** if it id wider than it is tall */
      if (!height) {
        if (WHRatio >= 1) {
          propertyMap.set("width", length);
          propertyMap.set("height", length / WHRatio);
          /** @todo expansion logic */
        } else if (WHRatio < 1) {
          propertyMap.set("height", length);
          propertyMap.set("width", length * WHRatio);
        }
        return propertyMap;
      }
      /**
       * if the resultant height for the length we would like to use is within the constrainst
       */
      if (length / WHRatio < height) {
        propertyMap.set("width", length);
        propertyMap.set("height", length / WHRatio);
        return propertyMap;
      } else {
        /** once we get here then the widrh is guaranteed to be less than the constraint */
        propertyMap.set("height", height);
        propertyMap.set("width", height * WHRatio);
        return propertyMap;
      }
    },
    getMessageImageHeight(meta) {
      if (this.fitToBox) {
        let propertyMap = this.getDimensionsForBox(this.componentLength);
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
  //   position: relative;
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
