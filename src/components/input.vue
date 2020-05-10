<template>
  <div>
    <label :for="uid">{{ label }}</label>
    <input type="text" :id="uid" />
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: {
    uid: String,
    label: String,
    autofocus: Boolean
  }
});
</script>
<style lang="scss" scoped></style>
