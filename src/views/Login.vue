<template>
  <div class="centered-form">
    <modal
      @close="modal.show = false"
      :showModal="modalData.show"
      :text="modalData.text"
    ></modal>
    <div class="centered-form__form">
      <form @submit.prevent="login" id="login">
        <div class="form-field">
          <h3>Login</h3>
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
        <div class="feedback"></div>
        <div class="form-field">
          <button class="mybt">Login</button>
          <a href="/signup">no account? signup here</a>
        </div>
      </form>
    </div>
  </div>
</template>
<script lang="ts">
import Modal from "@/components/modal.vue"; // @ is an alias to /src
import { login, setCookie } from "@/common/index.ts";
import Vue from "vue";
import axios, { AxiosPromise } from "axios";
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
      }
    };
  },
  methods: {
    async login(): Promise<Boolean> {
      if (
        !this.isTrueString(this.userData.username) ||
        !this.isTrueString(this.userData.password)
      ) {
        this.modal.text = "username and passowrd are required";
        this.modal.show = true;
        return false;
      }
      let authData;
      try {
        authData = (await login(this.userData)).data;
        console.log(authData);

        let token = authData.token;
        let username = authData.username;
        setCookie("username", username, 1000000);
        setCookie("token", token, 1000000);
        window.location.href = "/home";
        return true;
      } catch (error) {
        console.log(JSON.stringify(error));
        console.log(error.response);
        return false;
      }
    },
    isTrueString(string: String): Boolean {
      return typeof string === "string" && string.trim().length > 0;
    }
  },
  computed: {
    modalData(): Object {
      return { show: this.modal.show, text: this.modal.text };
    }
  }
});
</script>
<style lang="scss" scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: HelveticaNeue-Light, "Helvetica Neue Light", "Helvetica Neue",
    Helvetica, Arial, "Lucida Grande", sans-serif;
  font-weight: 300;
  font-size: 0.95rem;
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
.centered-form {
  display: flex;
  align-items: center;
  height: 100vh;
  width: 100vw;
  justify-content: center;
  background: -moz-linear-gradient(
    125deg,
    rgb(39, 130, 51) 0,
    rgb(110, 129, 49) 100%
  );
  background: -webkit-gradient(
    linear,
    left top,
    right bottom,
    color-stop(0, rgb(39, 130, 51)),
    color-stop(100%, rgb(110, 129, 49))
  );
  background: -webkit-linear-gradient(
    125deg,
    rgb(39, 130, 51) 0,
    rgb(110, 129, 49) 100%
  );
  background: -o-linear-gradient(
    125deg,
    rgb(39, 130, 51) 0,
    rgb(110, 129, 49) 100%
  );
  background: -ms-linear-gradient(
    125deg,
    rgb(39, 130, 51) 0,
    rgb(110, 129, 49) 100%
  );
  background: linear-gradient(
    325deg,
    rgb(39, 130, 51) 0,
    rgb(110, 129, 49) 100%
  );
}
</style>
