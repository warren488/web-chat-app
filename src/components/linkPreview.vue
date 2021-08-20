<template>
  <div>
    <div v-if="loading && !previewData">loading preview...</div>
    <a :href="previewData.url" target="_blank">
      <div v-if="previewData" class="linkpreview">
        <img class="linkpreview__img" :src="previewData.image" alt />
        <div>
          <header class="linkpreview__title">{{ previewData.title }}</header>
          <span class="linkpreview__description">
            {{ previewData.description }}
          </span>
        </div>
      </div>
    </a>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: {
    previewData: Object,
    loading: Boolean
  }
});
</script>
<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: none;
}
.linkpreview {
  display: flex;
  overflow: hidden;
  margin-right: 4px;
  max-width: 700px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.5);
  margin-bottom: 16px;

  &__img {
    width: 100px;
  }
  &__title {
    font-weight: bold;
  }
}
</style>
