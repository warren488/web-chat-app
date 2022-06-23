<template>
  <div class="content">
    <slot></slot>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: {
    display: Boolean,
    type: String
  }
});
</script>
<style lang="scss" scoped>
.content {
  display: flex;
  justify-content: center;
  align-items: center;

  &::before {
    margin-right: 0.5rem;
  }

  &::after {
    margin-left: 0.5rem;
  }

  &::before,
  &::after {
    content: "";
    height: 1px;
    background-color: currentColor;
    flex-basis: 100%;
  }
}
</style>
