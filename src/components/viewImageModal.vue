<template>
  <div>
    <!-- Modal -->
    <div
      class="modal fade"
      id="imageViewer"
      ref="imageViewer"
      tabindex="-1"
      aria-label="image viewer modal"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div
          class="modal-content"
          :style="{
            width: width + 'px',
            height: height + 'px',
            margin: '0 auto'
          }"
        >
          <div class="img-container">
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="emitClose"
            ></button>
            <img
              ref="img"
              class="img"
              :src="src"
              :alt="alt"
              :style="{
                width: width + 'px',
                height: height + 'px'
              }"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- end -->
  </div>
</template>
<script>
export default {
  name: "modal",
  props: ["showModal", "text", "src", "props", "alt", "width", "height"],
  data() {
    return {
      focus: null,
      myModal: null
    };
  },
  mounted() {
    // @ts-ignore
    this.myModal = new bootstrap.Modal(this.$refs.imageViewer, {
      backdrop: "static",
      keyboard: false
    });
    this.$refs.imageViewer.addEventListener("hidePrevented.bs.modal", event => {
      console.log("do something");
      // do something...
      this.$emit("close");
    });
  },
  methods: {
    open() {
      this.myModal.show();
    },
    close() {
      this.myModal.hide();
    },
    emitClose() {
      this.$emit("close");
    }
  },
  computed: {
    computedSrc() {
      console.log(this.src);
      return this.src;
    },
    computedWidth() {
      console.log(this.width);
      return this.width;
    },
    computedHeight() {
      console.log(this.height);
      return this.height;
    }
  },
  watch: {
    showModal(newVal) {
      if (newVal) {
        this.open();
      } else {
        this.close();
      }
    }
    // src(newVal) {
    //   console.log(newVal);
    //   this.$refs.img.src = newVal;
    //   // return this.src;
    // }
  }
};
</script>
<style lang="scss" scoped>
.img {
  width: 100%;
  height: 100%;
}

.img-container {
  position: relative;
}

.btn-close {
  transform: scale(2);
  position: absolute;
  cursor: pointer;
  background-color: rgba(200, 200, 200, 0.5);
  right: 1rem;
  top: 1rem;
}
</style>
