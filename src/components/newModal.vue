<template>
  <!-- // NB!!! v-ifs dont work really well with this modal because the v-if destroys it before we can remove the 
  // backdrop, i think this occurs because its created in js (maybe partially) -->
  <div
    class="modal fade"
    ref="modalContainer"
    tabindex="-1"
    aria-label="image viewer modal"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <slot name="full-replace">
          <div class="modal-header">
            {{ header }}
            <slot name="header"></slot>
          </div>

          <div class="modal-body">
            {{ text }}
            <slot name="body"></slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <button
                v-if="!confirm"
                ref="closeButton"
                class="btn btn-success"
                @click="$emit('close')"
              >
                OK
              </button>
              <div v-if="confirm">
                <button
                  ref="closeButton"
                  class="btn btn-danger mx-1"
                  @click="$emit('deny')"
                >
                  Deny
                </button>
                <button
                  ref="closeButton"
                  class="btn btn-success"
                  @click="$emit('accept')"
                >
                  Accept
                </button>
              </div>
            </slot>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  // NB!!! v-ifs dont work really well with this modal because the v-if destroys it before we can remove the
  // backdrop, i think this occurs because its created in js (maybe partially)
  name: "modal",
  props: ["showModal", "text", "header", "confirm"],
  data() {
    return {
      myModal: null
    };
  },
  mounted() {
    // @ts-ignore
    this.myModal = new bootstrap.Modal(this.$refs.modalContainer, {
      backdrop: "static",
      keyboard: false
    });
    this.$refs.modalContainer.addEventListener(
      "hidePrevented.bs.modal",
      event => {
        this.$emit("close");
      }
    );
    this.$refs.modalContainer.addEventListener("hidden.bs.modal", event => {
      this.$emit("closed");
    });
    if (this.showModal === true) {
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
