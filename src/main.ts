import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store/index";
import {
  getCookie,
  clearNotifications,
  getFirebaseSigninToken,
  signInToFirebase,
  markAsReceived
} from "./common";
import firebase from "firebase/app";
import "firebase/auth";
import { eventBus } from "@/common/eventBus";
import { Notyf } from "notyf";
import MdField from "vue-material/dist/components/MdField";
Vue.config.productionTip = false;

let token = getCookie("token");
if (token) {
  store.dispatch("setUpApp");
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/worker.js", {
      scope: "/"
    })
    .then(registration => {
      return registration.update();
    });

  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data.type === "openChat") {
      router.push("/home?chat=" + event.data.chat);
      // store.commit("setCurrentChat", event.data.chat);
      // store.commit("setHomeView", "chatbody");
    }
  });
}

if (process.env.NODE_ENV === "development") {
  const auth = firebase.auth();
  const storage = firebase.storage();
  // @ts-ignore
  auth.useEmulator("http://localhost:9099");
  storage.useEmulator("localhost", 9199);
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
  // this funny syntax is basically unsubscribing to authstatechanged because onAuthStateChanged returns the
  // the unsubscribe function
  unsubInitialAuthCheck();
});

clearNotifications();
window.onfocus = () => {
  store.commit("setFocused");
  store.dispatch("appFocused");
  clearNotifications();
};
window.onblur = () => {
  store.commit("setBlurred");
};
window.onoffline = () => {
  store.commit("setOffline");
};
window.ononline = () => {
  store.commit("setOnline");
};
Vue.use(MdField);
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
