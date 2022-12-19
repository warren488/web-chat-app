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
    <form class="main-form" @submit.prevent="login" id="login">
      <!-- <h4>Welcome Back</h4> -->
      <h3 class="form-heading">Sign in</h3>
      <button
        type="button"
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
          class="form-control"
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
            class="form-control"
            id="password"
            aria-describedby="basic-addon3"
          />
          <button
            class="btn password-toggle"
            type="button"
            id="button-addon2"
            @click="seePassword"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              class="bi bi-eye"
              viewBox="0 0 16 16"
            >
              <path
                d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"
              />
              <path
                d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"
              />
            </svg>
          </button>
        </div>
      </div>
      <div v-if="feedbackText" class="alert alert-danger d-flex" ref="feedback">
        <svg
          width="24"
          height="24"
          class="bi flex-shrink-0 me-2"
          viewBox="0 0 16 16"
        >
          <path
            fill="currentColor"
            d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
          />
        </svg>
        {{ feedbackText }}
      </div>
      <div class="form-field">
        <button class="btn btn-success mb-2 w-100">Sign in</button>
        <div>
          Dont have an account?
          <router-link class="" to="/signup">Sign up here</router-link>
        </div>
      </div>
    </form>
  </div>
</template>
<script lang="ts">
import Modal from "@/components/modal.vue"; // @ is an alias to /src
import Loader from "@/components/loader.vue"; // @ is an alias to /src
import { login, loginWithGoogle } from "@/common/index";
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
    modalData() {
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
  flex-wrap: wrap;
  min-height: 100vh;
  background: var(--bs-green);
}

.main-form {
  background: rgba(250, 250, 250, 0.9);
  border: 1px solid #e1e1e1;
  border-radius: 5px;
  padding: 0 20px;
  margin: 20px;
  width: 320px;
}
.form-heading {
  text-align: center;
  margin: var(--form-separation) 0;
}

.form-field {
  margin: var(--form-separation) 0;
  label {
    display: block;
    margin-bottom: 7px;
  }
  input {
    border: 1.5px solid var(--bs-success);
    padding: 10px;
  }
}
.password-toggle {
  background-color: white;
  color: inherit;
  border: solid 1.5px var(--bs-success);
  border-left: none;
}
</style>
