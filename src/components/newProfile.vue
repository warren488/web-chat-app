<template>
  <div class="profile-container">
    <div class="main-info">
      <div class="main-info__img">
        <loader type="ring" :display="isImgLoading" />
        <img
          v-if="details.imgUrl"
          class="profile-img"
          :src="details.imgUrl"
          alt=""
        />
        <img
          v-if="!details.imgUrl"
          class="profile-img"
          src="/assets/img/abstract-user-flat-1.svg"
          alt=""
        />
      </div>
      <div class="main-info__text">
        <h1>{{ details.username }}</h1>
        <div :class="{ status: true, empty: !!details.status }">
          {{
            details.status ||
              `${details.username} doesnt currently have a status`
          }}
        </div>
      </div>
    </div>
    <button class="btn btn-success">Send Request</button>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Loader from "@/components/loader.vue"; // @ is an alias to /src
import { mapGetters } from "vuex";
export default Vue.extend({
  created() {},
  props: {
    details: Object
  },
  data() {
    return {
      userData: {
        username: ""
      },
      imgLoading: false
    };
  },
  components: { Loader },
  methods: {},
  computed: {
    ...mapGetters(["user"]),

    isImgLoading() {
      return this.imgLoading;
    }
  }
});
</script>
<style lang="scss" scoped>
.main-info__img {
  position: relative;
  overflow: hidden;
  border-radius: 50%;
  box-shadow: 0px 0px 5px gray;
  width: 100px;
  height: 100px;
  margin-right: 0.5rem;

  .profile-img {
    width: 100px;
  }
}

.main-info {
  display: flex;
  margin-bottom: 0.5rem;
}

.status {
  color: var(--bs-gray);
  .empty {
    font-style: italic;
  }
}

.profile-container {
  padding: 1rem;
  //   display: flex;
}

label {
  font-weight: bold;
}
</style>
