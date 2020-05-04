<template>
  <transition name="modal">
    <div v-if="showModal" class="modal-mask">
      <div class="modal-wrapper">
        <div
          ref="container"
          @keydown.esc="$emit('close')"
          tabindex="0"
          class="modal-container"
        >
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
                  class="modal-default-button"
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
  </transition>
</template>
<script>
import { FocusGrabber } from "@/common";
export default {
  name: "modal",
  props: ["showModal", "text"],
  data() {
    return {
      focus: null
    };
  },
  mounted() {},
  watch: {
    showModal(newVal) {
      if (newVal) {
        // oh how the mighty have fallen (the modal doesnt show up at the exact moment that showModal becomes true)
        setTimeout(() => {
          if (this.$refs.closeButton) {
            this.$refs.closeButton.focus();
          } else if (this.$refs.container) {
            console.log("here");
            this.$refs.container.focus();
          }
        }, 30);
      }
    }
  }
};
</script>
<style lang="scss" scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  min-width: 300px;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  margin: 0px auto;
  padding: 40px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  font-family: Helvetica, Arial, sans-serif;

  &:focus {
    box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.33);
  }
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-body {
  margin: 20px 0;
}

.modal-default-button {
  float: right;
  cursor: pointer;
  background-color: lightgray;
  border-radius: 2px;
  padding: 4px;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
