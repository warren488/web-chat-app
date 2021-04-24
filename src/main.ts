import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import {
  getCookie,
  clearNotifications,
  getFirebaseSigninToken,
  signInToFirebase,
  markAsReceived
} from "./common";
import * as firebase from "firebase/app";
import "firebase/auth";
import { eventBus } from "@/common/eventBus";
import { Notyf } from "notyf";
import MdField from "vue-material/dist/components/MdField";
Vue.config.productionTip = false;

/** if we have a token then there's no possibility of running this a second time on login */
let token = getCookie("token");
if (token) {
  store.dispatch("setUpApp");
}

eventBus.$on("newFriend", function(data) {
  if (data.requestAccepted) {
    let notification = new Notyf({
      duration: 5000,
      dismissible: true,
      position: { x: "center", y: "top" }
    });
    notification.success(
      `${data.friendshipData.username} has accepted your friend request`
    );
  }
});
eventBus.$on("newFriendRequest", function(data) {
  let notification = new Notyf({
    duration: 5000,
    dismissible: true,
    position: { x: "center", y: "top" }
  });
  notification.success(`${data.username} sent you a friend request`);
});

/**
 * so the theory here is that this runs on every page load whether there is a direct action
 * or not (yet to be validated) and therefore we can use it to see if the user has an active
 * session if not we can simply request a token using the users' current application session
 */
/** @todo only works if we are already signed in */
let unsubInitialAuthCheck = firebase.auth().onAuthStateChanged(async user => {
  if (!user && getCookie("token")) {
    let { token } = await getFirebaseSigninToken();
    return signInToFirebase(token);
  }
  unsubInitialAuthCheck();
});

clearNotifications();
window.onfocus = () => {
  store.state.focused = true;
  if (store.state.currChatFriendshipId) {
    console.log(store.state.currChatFriendshipId);

    store.commit("markChatMessagesAsRead", {
      friendship_id: store.state.currChatFriendshipId
    });
    const messages = store.state.messages[store.state.currChatFriendshipId];
    markAsReceived(store.state.currChatFriendshipId, [
      messages[0].createdAt,
      messages[messages.length - 1].createdAt
    ]);
  }
  clearNotifications();
};
window.onblur = () => {
  store.state.focused = false;
};
window.onoffline = () => {
  eventBus.$emit("offline");
  store.state.network = false;
};
window.ononline = () => {
  eventBus.$emit("online");
  store.state.network = true;
};
Vue.use(MdField);
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
