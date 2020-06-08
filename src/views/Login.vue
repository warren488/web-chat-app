<template>
  <div class="form-container">
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
        <div class="form-field">
          <label for="username">username</label>
          <input
            v-model.lazy="userData.username"
            type="text"
            name="username"
            autofocus
          />
        </div>
        <div class="form-field">
          <label for="password">password</label>
          <input
            v-model.lazy="userData.password"
            type="password"
            name="password"
          />
        </div>
        <div v-if="feedbackText" class="feedback" ref="feedback">
          {{ feedbackText }}
        </div>
        <div class="form-field">
          <button class="mybt">Login</button>
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
import {
  login,
  setCookie,
  getFriends,
  signInToFirebase,
  getFirebaseSigninToken
} from "@/common/index.ts";
import { errorToMessage } from "@/common/network";
import Vue from "vue";
import axios, { AxiosPromise } from "axios";
import { mapActions } from "vuex";

export default Vue.extend({
  components: { Modal },
  data() {
    return {
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
        authData = (await login(this.userData)).data;
        /** i dont think we necessarily need to wait on or keep track of this
         * it should complete before the user tries to send any images or audio,
         * remember this is required for only writes and not reads */
        getFirebaseSigninToken().then(token => signInToFirebase(token));
        setCookie("username", authData.username, 1000000);
        setCookie("token", authData.token, 1000000);
        await this.setUpApp();
        this.$router.push("/home");
        return true;
      } catch (error) {
        console.log(error);
        this.feedback = errorToMessage(error);
      }
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
  background: linear-gradient(
    325deg,
    rgb(39, 130, 51) 0,
    rgb(110, 129, 49) 100%
  );
}
</style>
