<template>
  <div
    class="modal fade"
    id="imageViewer"
    ref="imageViewer"
    tabindex="-1"
    aria-label="image viewer modal"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <slot name="full-replace">
          <div class="modal-header">
            <slot name="header"></slot>
          </div>

          <div class="modal-body">
            {{ text }}
            <slot name="body"></slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <button
                ref="closeButton"
                class="modal-default-button mybt"
                @click="$emit('close')"
              >
                OK
              </button>
            </slot>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>
<script>
import { FocusGrabber } from "@/common";
export default {
  name: "modal",
  props: ["showModal", "text"],
  data() {
    return {
      myModal: null
    };
  },
  mounted() {
    // @ts-ignore
    this.myModal = new bootstrap.Modal(this.$refs.imageViewer, {
      backdrop: "static",
      keyboard: false
    });
    console.log(this.myModal);
    this.$refs.imageViewer.addEventListener("hidePrevented.bs.modal", event => {
      this.$emit("close");
    });
    if (this.showModal === true) {
      console.log(this.showModal);
      this.open();
    }
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
</style>
