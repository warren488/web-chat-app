import Vue from "vue";
import Router from "vue-router";
import { authBeforeEnter, upgradeToAuth } from "@/common";
Vue.use(Router);

const Home = () => import("./views/Home.vue");
const Login = () => import("./views/Login.vue");
const Signup = () => import("./views/Signup.vue");
const Landing = () => import("./views/Landing.vue");
const Profile = () => import("./views/Profile.vue");
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
      beforeEnter: upgradeToAuth,
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
      path: "/landing",
      name: "landing",
      component: Landing
    },
    {
      beforeEnter: authBeforeEnter,
      path: "*",
      redirect: "/home"
    }
  ]
});
