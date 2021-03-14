import Vue from "vue";

export const eventBus = new Vue({
  methods: {
    dataLoaded() {
      this.$emit("loaded");
    },
    newFriendship(friendshipData) {
      this.$emit("newFriend", friendshipData);
    }
  }
});
