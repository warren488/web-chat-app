<template>
  <div class="centered-form">
    <div class="loader-backdrop" v-if="loading">
      <loader type="ring" :display="true" />
    </div>
    <modal
      @close="closeAndGo"
      :showModal="modalData.show"
      :text="modalData.text"
    ></modal>
    <div class="centered-form__form">
      <form @submit.prevent="signup" id="signup">
        <div class="form-field">
          <h3>Signup</h3>
        </div>
        <div class="form-field">
          <label class="form-label" for="username">
            username<span aria-hidden="true">*</span>
            <span ref="uniqueFeedbackEl" id="uniqe-feedback">
              {{ uniqueFeedback }}</span
            >
          </label>
          <input
            @blur="checkUsername"
            v-model.lazy="userData.username"
            minlength="4"
            type="text"
            name="username"
            id="username"
            autofocus
            required
          />
        </div>
        <div class="form-field">
          <label class="form-label" for="email"> email</label>
          <input
            v-model.lazy="userData.email"
            type="email"
            name="email"
            id="email"
            autofocus
          />
        </div>
        <div class="form-field">
          <label class="form-label" for="password">
            password<span aria-hidden="true">*</span>
          </label>
          <input
            v-model.lazy="userData.password"
            type="password"
            name="password"
            id="password"
            minlength="7"
            required
          />
        </div>
        <div class="form-field">
          <label class="form-label" for="confirm-password">
            confirm password<span aria-hidden="true">*</span>
          </label>
          <input
            v-model.lazy="userData.confirmPassword"
            type="password"
            name="confirm-password"
            id="confirm-password"
            minlength="7"
            required
          />
        </div>
        <div class="feedback" ref="feedback">
          {{ feedbackText }}
        </div>
        <div class="form-field">
          <button class="mybt">Signup</button>
        </div>
      </form>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Modal from "@/components/modal.vue"; // @ is an alias to /src
import Loader from "@/components/loader.vue"; // @ is an alias to /src
import { signup, setCookie, checkusername } from "@/common";
import { errorToMessage } from "../common/network";
import { mapActions } from "vuex";
export default Vue.extend({
  components: { Modal, Loader },
  data() {
    return {
      userData: {},
      feedback: "",
      uniqueFeedback: "",
      modal: {
        show: false,
        text: ""
      },
      loading: false
    };
  },
  methods: {
    ...mapActions(["setUpApp"]),
    async checkUsername() {
      let unique = await checkusername(this.userData.username);
      if (!unique) {
        this.uniqueFeedback = "(taken)";
        this.$refs.uniqueFeedbackEl.classList.remove("valid");
        this.$refs.uniqueFeedbackEl.classList.add("invalid");
      } else {
        this.uniqueFeedback = "(available)";
        this.$refs.uniqueFeedbackEl.classList.add("valid");
        this.$refs.uniqueFeedbackEl.classList.remove("invalid");
      }
    },
    closeAndGo() {
      this.modal.show = false;
      this.$router.push("/home");
    },
    async signup() {
      if (this.userData.password !== this.userData.confirmPassword) {
        return (this.feedback = "make sure passwords match");
      }
      try {
        this.loading = true;
        /**
         * we dont want to send empty data to the server because for example the email must be
         * unique, if we allow the email to be sent empty then we will continuously get conflicts
         */
        for (const data in this.userData) {
          if (this.userData[data] === "") {
            delete this.userData[data];
          }
        }
        let authData = (await signup(this.userData)).data;
        this.modal.text = `successfully created account ${authData.user.username}`;
        this.modal.show = true;
        setCookie("username", authData.user.username, 1000000);
        setCookie("token", authData.token, 1000000);
        this.userData = {
          username: "",
          password: "",
          confirmPassword: ""
        };
        await this.setUpApp();
        this.loading = false;
      } catch (error) {
        this.loading = false;
        this.feedback = errorToMessage(error);
      }
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
.feedback,
.invalid {
  color: red;
}
.valid {
  color: green;
}

form.invalid {
  box-shadow: 1px 1px 1px red;
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

.form-field h3 {
  font-weight: 600;
  text-align: center;
  font-size: 1.5rem;
}
.form-field {
  margin: 20px 0;
}
.form-label {
  font-weight: bold;
  color: rgb(0, 51, 0);
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
  background: var(--bs-green);
}
</style>
