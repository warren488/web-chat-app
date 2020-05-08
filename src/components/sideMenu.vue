<template>
  <div :class="{ container: true, active: active }">
    <button class="close-button" @click="$emit('close')">X</button>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { getCookie } from "@/common";
import { debounce } from "debounce";
import { mapGetters } from "vuex";

export default Vue.extend({
  props: {
    active: Boolean
  },
  created() {},
  name: "sideMenu",
  data() {
    return {};
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.container {
  transition: min-width 0.3s ease-in, width 0.3s ease-in;
  display: inline-flex;
  flex-direction: column;
  position: fixed;
  left: 0px;
  top: 0px;
  width: 0%;
  min-width: 0px;
  max-width: 350px;
  height: 100vh;
  background: linear-gradient(89.81deg, #3a6136 0.03%, #005d40 64.36%);
  overflow: hidden;
}

.close-button {
  align-self: flex-end;
  background-color: transparent;
  color: white;
  font-weight: bold;
  border: none;
  padding: 4px;
  cursor: pointer;
}

.container.active {
  width: 30%;
  min-width: 200px;
  //   transition: min-width 0.3s ease, width 0.3s ease;
}
</style>
