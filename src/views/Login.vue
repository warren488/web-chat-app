<template>
  <div class="form-container">
    <div class="loader-backdrop" v-if="loading">
      <loader type="ring" :display="true" />
    </div>
    <modal
      @close="modal.show = false"
      :showModal="modalData.show"
      :text="modalData.text"
    ></modal>
    <div class="centered-form__form">
      <form @submit.prevent="login" id="login">
        <div class="form-field">
          <h3 class="">Login</h3>
        </div>
        <div class="mb-3">
          <label for="username" class="form-label fw-bold">
            Userame
          </label>
          <input
            v-model.lazy="userData.username"
            type="text"
            class="form-control border-light"
            id="username"
          />
        </div>
        <label for="password" class="form-label fw-bold">Password</label>
        <div class="input-group mb-3">
          <input
            v-model.lazy="userData.password"
            type="password"
            ref="passwordinput"
            class="form-control border-light"
            id="password"
            aria-describedby="basic-addon3"
          />
          <button
            class="btn btn-outline-light bg-white p-0 px-1"
            type="button"
            id="button-addon2"
            @click="seePassword"
          >
            <img
              class="toggle password visibility"
              src="/assets/img/eye-fill.svg"
              style="width: 32px;"
            />
          </button>
        </div>
        <div v-if="feedbackText" class="feedback" ref="feedback">
          {{ feedbackText }}
        </div>
        <div class="form-field">
          <!-- <button class="mybt">Login</button> -->
          <button class="btn btn-success mb-2">Login</button>
          <a href="" @click.prevent="$router.push('/signup')"
            >no account? signup here</a
          >
        </div>
      </form>
    </div>
  </div>
</template>
<script lang="ts">
import Modal from "@/components/modal.vue"; // @ is an alias to /src
import Loader from "@/components/loader.vue"; // @ is an alias to /src
import {
  login,
  setCookie,
  getFriendShips,
  signInToFirebase,
  getFirebaseSigninToken
} from "@/common/index.ts";
import { errorToMessage } from "@/common/network";
import Vue from "vue";
import axios, { AxiosPromise } from "axios";
import { mapActions } from "vuex";

export default Vue.extend({
  components: { Modal, Loader },
  data() {
    return {
      loading: false,
      userData: {
        username: "",
        password: ""
      },
      modal: {
        show: false,
        text: ""
      },
      feedback: ""
    };
  },
  methods: {
    ...mapActions(["setUpApp"]),
    seePassword() {
      if (this.$refs.passwordinput.type === "text") {
        this.$refs.passwordinput.type = "password";
      } else {
        this.$refs.passwordinput.type = "text";
      }
    },
    async login(): Promise<Boolean> {
      this.feedback = "";
      if (
        !this.isTrueString(this.userData.username) ||
        !this.isTrueString(this.userData.password)
      ) {
        this.feedback = "username and passowrd are required";
        return false;
      }
      let authData;
      try {
        this.loading = true;
        authData = (await login(this.userData)).data;
        setCookie("username", authData.username, 1000000);
        setCookie("token", authData.token, 1000000);
        /** i dont think we necessarily need to wait on or keep track of this
         * it should complete before the user tries to send any images or audio,
         * remember this is required for only writes and not reads */
        getFirebaseSigninToken().then(({ token }) => signInToFirebase(token));
        await this.setUpApp();
        this.$router.push("/home");
        this.loading = false;
        return true;
      } catch (error) {
        console.log(error);
        this.feedback = errorToMessage(error);
        this.loading = false;
      }
      this.loading = false;
    },
    isTrueString(string: String): Boolean {
      return typeof string === "string" && string.trim().length > 0;
    }
  },
  computed: {
    modalData(): Object {
      return { show: this.modal.show, text: this.modal.text };
    },
    feedbackText() {
      return this.feedback;
    }
  }
});
</script>
<style lang="scss" scoped>
.newerror {
  --error-color: rgb(200, 0, 0);
}
.olderror {
  --error-color: darkred;
}

.loader-backdrop {
  position: absolute;
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(100, 100, 100, 0.5);
}

.feedback {
  background-color: red;
  font-weight: bold;
  color: white;
  box-shadow: 0px 0px 3px 5px red;
}

.form-field h3 {
  font-weight: 600;
  text-align: center;
  font-size: 1.5rem;
}
.form-field {
  margin: 20px 0;
}
.centered-form__form {
  background: rgba(250, 250, 250, 0.9);
  border: 1px solid #e1e1e1;
  border-radius: 5px;
  padding: 0 20px;
  margin: 20px;
  width: 320px;
}
.form-field > * {
  width: 100%;
}

.form-field label {
  display: block;
  margin-bottom: 7px;
}

.form-field input,
.form-field select {
  border: 1px solid #e1e1e1;
  padding: 10px;
}
.form-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: var(--bs-green);
}
</style>
