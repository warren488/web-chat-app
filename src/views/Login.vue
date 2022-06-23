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
        <button
          @click.prevent="googleLogin"
          class="btn btn-danger w-100 fw-bold"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-google"
            viewBox="0 0 16 16"
          >
            <path
              d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"
            />
          </svg>
          Sign in with Google
        </button>
        <separator style="margin-top: var(--form-separation)">or</separator>
        <div class="form-field">
          <label for="username" class="form-label fw-bold"> Userame </label>
          <input
            v-model.lazy="userData.username"
            type="text"
            class="form-control border-light"
            id="username"
          />
        </div>
        <div class="form-field">
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
                src="/assets/img/eye.svg"
                style="width: 32px"
              />
            </button>
          </div>
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
import { login, loginWithGoogle } from "@/common/index.ts";
import { errorToMessage } from "@/common/network";
import Vue from "vue";
import axios, { AxiosPromise } from "axios";
import { mapActions } from "vuex";
import {} from "@/common";
import Separator from "../components/Separator.vue";

export default Vue.extend({
  components: { Modal, Loader, Separator },
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
    async googleLogin() {
      this.loading = true;
      try {
        await loginWithGoogle();
        this.$router.push("/home");
      } catch (error) {
        console.log(error);
      }
      this.loading = false;
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
        this.$router.push("/home");
        return true;
      } catch (error) {
        console.log(error);
        this.feedback = errorToMessage(error);
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
.form-container {
  --form-separation: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  background: var(--bs-green);
}
.newerror {
  --error-color: rgb(200, 0, 0);
}
.olderror {
  --error-color: darkred;
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
  margin: var(--form-separation) 0;
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
</style>
