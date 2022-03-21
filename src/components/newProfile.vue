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
    <div v-if="!isFriend">
      <button
        class="btn btn-success"
        v-if="!sentRequestToMe"
        :disabled="hasRequestFromMe"
        @click="sendRequest"
      >
        Send Request
      </button>
      <button @click="addFriend" class="btn btn-success" v-if="sentRequestToMe">
        Accept Request
      </button>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Loader from "@/components/loader.vue"; // @ is an alias to /src
import { mapGetters } from "vuex";
import { addFriend, sendRequest } from "@/common";
import { Notyf } from "notyf";
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
  methods: {
    sendRequest() {
      console.log(this.details);
      if (!this.hasRequestFromMe && !this.sentRequestToMe) {
        sendRequest(this.details.id).then(data => {
          let notification = new Notyf({
            duration: 5000,
            dismissible: true,
            position: { x: "center", y: "top" }
          });
          notification.success(`request successfull sent`);
          this.$emit("close");
        });
      }
    },

    addFriend() {
      addFriend({
        username: this.details.username,
        id: this.details.id
      }).then(data => {
        let notification = new Notyf({
          duration: 5000,
          dismissible: true,
          position: { x: "center", y: "top" }
        });
        notification.success(`request successfull accepted`);
        this.$emit("close");
      });
    }
  },
  computed: {
    ...mapGetters(["user", "friendShips"]),

    isImgLoading() {
      return this.imgLoading;
    },

    sentRequestToMe() {
      if (this.user && this.user.interactions) {
        let result = this.user.interactions.receivedRequests.find(
          request => this.details.id === request.fromId
        );
        return !!result;
      }
      return false;
    },
    isFriend() {
      return !!(
        this.friendShips &&
        this.friendShips.find(({ friendId }) => friendId === this.details.id)
      );
    },
    hasRequestFromMe() {
      if (this.user && this.user.interactions) {
        let result = this.user.interactions.sentRequests.find(
          request => this.details.id === request.userId
        );
        return !!result;
      }
      return false;
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
