<template>
  <div>
    <loader type="ring" :display="loading" />
    <new-profile v-if="data && !loading" :details="data" />
  </div>
</template>

<script lang="ts">
import { getUserById } from "@/common";
import Vue from "vue";
import Loader from "./loader.vue";
import newProfile from "./newProfile.vue";

export default Vue.extend({
  components: { newProfile, Loader },
  props: ["userId"],
  data() {
    return { data: null, loading: true };
  },
  created() {
    if (this.userId) {
      getUserById(this.userId).then(user => {
        this.loading = false;
        this.data = user;
      });
    } else {
      this.data = null;
    }
  },
  watch: {
    userId() {
      this.loading = true;
      if (this.userId) {
        getUserById(this.userId).then(user => {
          this.loading = false;
          this.data = user;
        });
      } else {
        this.data = null;
      }
    }
  }
});
</script>

<style></style>
