<template>
  <div style="position: relative">
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
  props: ["showModal", "text", "src", "alt", "width", "height"],
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
  watch: {
    showModal(newVal) {
      if (newVal) {
        this.open();
      } else {
        this.close();
      }
    }
  }
};
</script>
<style lang="scss" scoped>
.modal {
  backdrop-filter: blur(4px);
}

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
