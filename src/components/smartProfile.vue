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
    getUserById(this.userId).then(user => {
      this.loading = false;
      this.data = user;
    });
  },
  watch: {
    userId() {
      this.loading = true;
      getUserById(this.userId).then(user => {
        this.loading = false;
        this.data = user;
      });
    }
  }
});
</script>

<style></style>
