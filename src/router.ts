import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import Profile from "./views/Profile.vue";
import Signup from "./views/Signup.vue";
import { getCookie, authBeforeEnter } from "@/common";
Vue.use(Router);

export default new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      beforeEnter: authBeforeEnter,
      path: "/home",
      name: "home",
      component: Home,
      props: route => ({ chat: route.query.chat })
    },
    {
      path: "/login",
      name: "logn",
      component: Login
    },
    {
      beforeEnter: authBeforeEnter,
      path: "/profile",
      name: "profile",
      component: Profile
    },
    {
      path: "/signup",
      name: "signup",
      component: Signup
    },
    {
      beforeEnter: authBeforeEnter,
      path: "*",
      redirect: "/home"
    }
  ]
});
