<template>
  <div class="centered-form">
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
          <label for="username">
            username<span aria-hidden="true">*</span>
            <span ref="uniqueFeedbackEl" id="uniqe-feedback">
              {{ uniqueFeedback }}</span
            >
          </label>
          <input
            @blur="checkUsername"
            v-model.lazy="userData.username"
            type="text"
            name="username"
            id="username"
            autofocus
            required
          />
        </div>
        <div class="form-field">
          <label for="email"> email</label>
          <input
            v-model.lazy="userData.email"
            type="email"
            name="email"
            id="email"
            autofocus
          />
        </div>
        <div class="form-field">
          <label for="password">
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
          <label for="confirm-password">
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
import { signup, setCookie, checkusername } from "@/common";
export default Vue.extend({
  components: { Modal },
  data() {
    return {
      userData: {},
      feedback: "",
      uniqueFeedback: "",
      modal: {
        show: false,
        text: ""
      }
    };
  },
  methods: {
    async checkUsername() {
      let unique = await checkusername(this.userData.username);
      if (!unique) {
        this.uniqueFeedback = "(taken)";
        this.$refs.uniqueFeedbackEl.classList.add("invalid");
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
      } catch (error) {
        console.log(error);
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
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: HelveticaNeue-Light, "Helvetica Neue Light", "Helvetica Neue",
    Helvetica, Arial, "Lucida Grande", sans-serif;
  font-weight: 300;
  font-size: 0.95rem;
}
.feedback,
.invalid {
  color: darkred;
}

form.invalid {
  box-shadow: 1px 1px 1px darkred;
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
