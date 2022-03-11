import { eventBus } from "@/common/eventBus";

export default {
  state: {
    dataLoaded: false,
    network: window.navigator.onLine,
    focused: document.visibilityState === "visible",
    currChatFriendshipId: "",
    dataLoadStarted: false
  },
  getters: {
    network: state => state.network,
    dataLoaded: state => state.dataLoaded,
    isInChat: state =>
      state.focused && state.currChatFriendshipId
        ? state.currChatFriendshipId
        : null,
    currChatFriendshipId: state => state.currChatFriendshipId
  },
  mutations: {
    setOffline(state) {
      eventBus.$emit("offline");
      state.network = false;
    },
    setOnline(state) {
      eventBus.$emit("online");
      state.network = true;
    },
    setDataLoadedTrue(state) {
      eventBus.$emit("loaded");
      state.dataLoaded = true;
    },
    setDataLoadedFalse(state) {
      eventBus.$emit("unloaded");
      state.dataLoaded = false;
    },
    setFocused(state) {
      eventBus.$emit("focused");
      state.focused = true;
    },
    setBlurred(state) {
      eventBus.$emit("blurred");
      state.focused = false;
    },
    setDataLoadSarted(state) {
      state.dataLoadStarted = true;
    },
    resetState(state) {
      state.dataLoaded = false;
      state.dataLoadStarted = false;
      state.currChatFriendshipId = "";
    },
    setCurrentChat(state, friendship_id) {
      state.currChatFriendshipId = friendship_id;
    }
  }
};
