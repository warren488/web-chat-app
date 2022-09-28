<template>
  <div ref="page" class="centered-form">
    <modal
      @close="modal.show = false"
      :showModal="modalData.show"
      :text="modalData.text"
    ></modal>
    <div ref="formContainer" class="centered-form__form">
      <form @submit.prevent="updateInfo" id="profile">
        <div class="header">
          <h1 class="heading-text">{{ editMode ? "Edit" : "View" }} Profile</h1>
          <div class="top-action-buttons">
            <div v-if="!readonly" class="editable">
              <button
                class="mybt bt--cancel"
                type="button"
                @click="cacelEdit"
                :disabled="!editMode"
              >
                Cancel
              </button>
              <button
                class="mybt bt--edit"
                type="button"
                @click="() => (!editMode ? (editMode = !editMode) : null)"
                :disabled="editMode"
              >
                edit
              </button>
            </div>
            <div v-if="readonly" class="add-friend">
              <!-- <button @click="addFriend" class="mybt" type="button">
                add friend
              </button> -->
              <button
                :disabled="hasRequestFromMe"
                @click="actionButtinHandler"
                class="mybt"
                type="button"
              >
                {{ responseOrRequest }}
              </button>
            </div>
          </div>
        </div>
        <div class="important-info">
          <div class="img-container">
            <loader type="ring" :display="isImgLoading" />
            <img
              v-if="details.imgUrl"
              class="profile-img"
              :src="details.imgUrl"
              alt=""
            />
            <img
              v-if="!details.imgUrl"
              class="profile-img"
              src="/assets/img/abstract-user-flat-1.svg"
              alt=""
            />
            <div
              @click="$refs.imgFile.click()"
              v-if="editMode"
              class="edit-img"
            >
              <input
                style="display: none"
                enctype="multipart/form-data"
                @input="imgInput"
                accept="image/*"
                ref="imgFile"
                type="file"
                name="img-file"
                id="img-file"
              />
              edit
            </div>
          </div>

          <div class="inline-fields">
            <div class="form-field" :class="{ 'edit-mode': editMode }">
              <label for="username">
                username
                <span ref="uniqueFeedbackEl" id="uniqe-feedback">
                  {{ uniqueFeedback }}</span
                >
              </label>
              <input
                :readonly="!editMode"
                @blur="checkUsername"
                v-model.lazy="details.username"
                type="text"
                name="username"
                id="username"
              />
            </div>
            <div class="form-field" :class="{ 'edit-mode': editMode }">
              <label for="status"> status</label>
              <input
                :readonly="!editMode"
                v-model.lazy="details.status"
                :placeholder="!details.location ? 'n/a' : ''"
                type="text"
                name="status"
                id="status"
                autofocus
              />
            </div>
          </div>
        </div>
        <div class="form-field" :class="{ 'edit-mode': editMode }">
          <label for="email"> email</label>
          <input
            :readonly="!editMode"
            v-model.lazy="details.email"
            :placeholder="!details.email ? 'n/a' : ''"
            type="email"
            name="email"
            id="email"
            autofocus
          />
        </div>
        <div class="form-field" :class="{ 'edit-mode': editMode }">
          <label for="location"> location</label>
          <input
            :readonly="!editMode"
            v-model.lazy="details.location"
            type="text"
            name="location"
            id="location"
            :placeholder="!details.location ? 'n/a' : ''"
            autofocus
          />
        </div>
        <div v-if="editMode" class="form-group password">
          <div class="form-field" :class="{ 'edit-mode': editMode }">
            <label for="password"
              >enter password<span aria-hidden="true">*</span></label
            >
            <input
              :readonly="!editMode"
              v-model.lazy="details.currentPassword"
              type="password"
              name="password"
              id="password"
              autofocus
            />
          </div>
          <div class="form-field" :class="{ 'edit-mode': editMode }">
            <label for="newPassword"> change password</label>
            <input
              :readonly="!editMode"
              v-model.lazy="details.newPassword"
              type="newPassword"
              name="newPassword"
              id="newPassword"
              autofocus
            />
          </div>
          <div class="form-field" :class="{ 'edit-mode': editMode }">
            <label for="confirm-password">
              confirm password<span
                v-if="userData.newPassword"
                aria-hidden="true"
                >*</span
              >
            </label>
            <input
              :readonly="!editMode"
              v-model.lazy="userData.confirmPassword"
              type="password"
              name="confirm-password"
              id="confirm-password"
              minlength="7"
              :required="details.newPassword"
            />
          </div>
        </div>
        <div class="feedback" ref="feedback">
          {{ feedbackText }}
        </div>
        <div v-if="!readonly" class="form-field">
          <button class="mybt">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Modal from "@/components/modal.vue"; // @ is an alias to /src
import Loader from "@/components/loader.vue"; // @ is an alias to /src
import {
  signup,
  setCookie,
  uploadImage,
  uploadToFireBase,
  getCookie,
  encodeBase64,
  checkusername,
  updateInfo,
  getUserInfo,
  addFriend,
  sendRequest
} from "@/common";
import store from "../store/index";
import { mapGetters, mapMutations } from "vuex";
export default Vue.extend({
  created() {
    this.getUserInfo();
  },
  props: {
    readonly: Boolean,
    displayData: Object
  },
  data() {
    return {
      userData: {
        username: ""
      },
      imgLoading: false,
      feedback: "",
      uniqueFeedback: "",
      modal: {
        show: false,
        text: ""
      },
      editMode: false
    };
  },
  components: { Modal, Loader },
  methods: {
    ...mapMutations(["setUser"]),
    async imgInput() {
      this.imgLoading = true;
      let imgFile = this.$refs.imgFile.files[0];
      /** @todo delete the old one to save space */
      const imgUrl = await uploadToFireBase(
        imgFile,
        `/profileImages/${store.state.user.id}`
      );
      this.userData = { ...this.userData, imgUrl };
      this.imgLoading = false;
    },
    fixHeight() {
      // get height of the form and let that dictate the height of the page (+20px for spacing)
      const innerHeight = this.$refs.formContainer.clientHeight;
      this.$refs.page.style.minHeight = innerHeight + 20 + "px";
    },
    actionButtinHandler() {
      if (!this.hasRequestFromMe && !this.sentRequestToMe) {
        sendRequest(this.originalData.id).then(data => {
          alert("request successfully sent");
          this.$emit("close");
        });
      } else if (this.sentRequestToMe) {
        this.addFriend();
      }
    },
    addFriend() {
      addFriend({
        username: this.originalData.username,
        id: this.originalData.id
      }).then(data => {
        alert("friend successfully added");
        this.$emit("close");
      });
    },
    async checkUsername() {
      if (this.userData.username === this.originalData.username) {
        return;
      }
      let unique = await checkusername(this.userData.username);
      if (!unique) {
        this.uniqueFeedback = "(taken)";
        this.$refs.uniqueFeedbackEl.classList.add("invalid");
      }
    },
    cacelEdit() {
      this.userData = this.originalData;
      this.editMode = false;
    },
    async getUserInfo() {
      /**
       * so we want to be very careful, only show the data passed if we are in readonly mode
       * so for example we dont want to say display this data on this page and for some reason
       * give the user the imperssion they can change someone else's data
       */

      if (this.readonly && this.displayData) {
        this.originalData = this.displayData;
        this.userData = Object.assign(this.displayData);
        return;
      }
      this.originalData = (await getUserInfo()).data;
      this.userData = Object.assign({}, this.originalData);
    },
    async updateInfo() {
      if (this.userData.password !== this.userData.confirmPassword) {
        return (this.feedback = "make sure passwords match");
      }
      try {
        /**
         * we dont want to send empty data to the server because for example the email must be
         * unique, if we allow the email to be sent empty then we will continuously get conflicts
         */

        // for (const data in this.userData) {
        //   if (this.userData[data] === "") {
        //     delete this.userData[data];
        //   }
        // }
        let authData = (await updateInfo(this.userData)).data;
        this.modal.text = `information updated`;
        this.modal.show = true;
        setCookie("username", authData.user.username, 1000000);
        this.originalData = Object.assign({}, authData.user);
        this.userData = Object.assign({}, authData.user);
        this.setUser(authData.user);
      } catch (error) {
        this.feedback = error.response.data.message;
      }
    }
  },
  computed: {
    ...mapGetters(["user"]),
    modalData(): Object {
      return { show: this.modal.show, text: this.modal.text };
    },
    sentRequestToMe() {
      if (this.user && this.user.interactions) {
        let result = this.user.interactions.receivedRequests.find(
          request => this.userData.id === request.fromId
        );
        return !!result;
      }
      return false;
    },
    hasRequestFromMe() {
      if (this.user && this.user.interactions) {
        let result = this.user.interactions.sentRequests.find(
          request => this.userData.id === request.userId
        );
        return !!result;
      }
      return false;
    },
    responseOrRequest() {
      if (this.sentRequestToMe) {
        return "accept request";
      } else if (this.hasRequestFromMe) {
        return "request already sent";
      }
      return "send request";
    },
    isImgLoading() {
      return this.imgLoading;
    },
    feedbackText() {
      return this.feedback;
    },
    details() {
      return this.userData;
    }
  }
});
</script>
<style lang="scss" scoped>
@keyframes rollout {
  from {
    max-height: 0px;
  }
  to {
    max-height: 1400px;
  }
}
.header {
  display: flex;
  margin-bottom: 8px;
  .top-action-buttons {
    flex-grow: 1;
    margin-left: 5px;
  }
}
.heading-text {
  display: inline;
}

.editable {
  max-height: 44px;
  overflow: hidden;
}
.img-container {
  position: relative;
  overflow: hidden;
  border-radius: 50%;
  box-shadow: 0px 0px 5px gray;
  width: 100px;
  height: 100px;

  .edit-img {
    display: none;
  }

  .profile-img {
    width: 100px;
  }
  &:hover .edit-img {
    font-size: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-weight: bold;
    color: white;
    left: 0;
    top: 0;
    background-color: rgba(0, 0, 0, 0.5);
    position: absolute;
    width: 100%;
    height: 100%;
  }
}

.important-info {
  display: flex;
  justify-content: space-between;
  .inline-fields {
    flex-grow: 1;
    margin-left: 8px;
    :first-child {
      margin-top: 0px;
    }
    :last-child {
      margin-bottom: 0px;
    }
  }
}

label {
  font-weight: bold;
}

.bt--cancel:disabled {
  width: 0%;
  // because we are setting the width to 0 we dont need to worry so much about the height
  // therefore we can avoid the weird of losing some of the height during transition
  padding-left: 0px;
  padding-right: 0px;
  margin-left: 0px;
  margin-right: 0px;
  overflow: hidden;
}

.bt--edit {
  width: 100%;
}

.bt--cancel:not(:disabled) {
  font-weight: bold;
  background-color: red;
  width: 100%;
  & + .bt--edit {
    width: 0%;
    padding: 0px;
    margin: 0px;
    overflow: hidden;
  }
}

.feedback,
.invalid {
  color: darkred;
}

form.invalid {
  box-shadow: 1px 1px 1px darkred;
}

.form-group.password {
  overflow: hidden;
  /**  causes the fixHeight function not to work because the element momentarily 
   has no height */
  animation: rollout 0.5s;
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
  padding: 10px 20px;
  margin: 20px;
  min-width: 500px;
  box-shadow: 8px 10px 10px rgba(0, 0, 0, 0.2),
    -8px 10px 10px rgba(0, 0, 0, 0.2);
}
.form-field > * {
  width: 100%;
}

.form-field label {
  display: block;
}

.inline-fields {
  display: inline-block;
}

.form-field input,
.form-field select {
  padding: 0px;
  border: none;
  background: transparent;
  transition: margin, border, padding, background-color 0.3s;
}

.form-field.edit-mode {
  label {
    margin-bottom: 7px;
  }
  input {
    border: 1px solid #e1e1e1;
    background-color: white;
    padding: 10px;
  }
}

.centered-form {
  display: flex;
  align-items: center;
  min-height: 100vh;
  justify-content: center;
  background: var(--bs-green);
}

@media (max-width: 576px) {
  .centered-form__form {
    min-width: 200px;
  }
}
</style>
