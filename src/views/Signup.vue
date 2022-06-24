<template>
  <div class="form-container">
    <div class="loader-backdrop" v-if="loading">
      <loader type="ring" :display="true" />
    </div>
    <modal
      @close="closeAndGo"
      :showModal="modalData.show"
      :text="modalData.text"
    ></modal>
    <form class="main-form" @submit.prevent="signup" id="signup">
      <h3 class="form-heading">Signup</h3>
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
          class="form-control"
          autofocus
          required
        />
      </div>
      <div class="form-field">
        <label class="form-label" for="email"> email</label>
        <input
          class="form-control"
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
          class="form-control"
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
          class="form-control"
          v-model.lazy="userData.confirmPassword"
          type="password"
          name="confirm-password"
          id="confirm-password"
          minlength="7"
          required
        />
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
        <button class="btn btn-success w-100">Signup</button>
      </div>
    </form>
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
    text-transform: capitalize;
    font-weight: bold;
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
