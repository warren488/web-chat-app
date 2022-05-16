import { eventBus } from "@/common/eventBus";

export default {
  state: {
    dataLoaded: false,
    network: window.navigator.onLine,
    focused: document.visibilityState === "visible",
    currChatFriendshipId: "",
    homeView: "chatlist",
    chatProminent: false,
    showPopupNotif: false,
    dataLoadStarted: false,
    activeYTSession: false,
    YTSessionFriendId: null
  },
  getters: {
    network: state => state.network,
    dataLoaded: state => state.dataLoaded,
    homeView: state => state.homeView,
    isInChat: state =>
      state.focused && state.currChatFriendshipId
        ? state.currChatFriendshipId
        : null,
    currChatFriendshipId: state => state.currChatFriendshipId,
    chatProminent: state => state.chatProminent,
    activeYTSession: state => state.activeYTSession,
    YTSessionFriendId: state => state.YTSessionFriendId
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
    setHomeView(state, view) {
      eventBus.$emit("homeViewChanged", view);
      state.homeView = view;
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
    },
    enablePopupNotif(state) {
      state.showPopupNotif = true;
    },
    disablePopupNotif(state) {
      state.showPopupNotif = false;
    },
    makeChatProminent(state) {
      state.chatProminent = true;
      state.showPopupNotif = false;
    },
    makeChatBackdrop(state) {
      state.chatProminent = false;
      state.showPopupNotif = true;
    },
    enterYTSession(state, friendship_id) {
      state.activeYTSession = true;
      state.YTSessionFriendId = friendship_id;
    },
    leaveYTSession(state) {
      state.activeYTSession = false;
      state.YTSessionFriendId = null;
    }
  }
};
