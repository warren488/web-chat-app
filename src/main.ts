import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { getCookie, clearNotifications } from "./common";

Vue.config.productionTip = false;

/** if we have a token then there's no possibility of running this a second time on login */
let token = getCookie("token");
if (token) {
  store.dispatch("setUpApp");
}

clearNotifications();
window.onfocus = () => clearNotifications();

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
