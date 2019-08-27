<template>
  <div class="chat__footer">
    <form @submit.prevent="sendMessage" id="message-form">
      <button id="emoji-button" type="button">&#128578;</button>
      <input
        ref="msgText"
        type="text"
        id="msg-txt"
        name="message"
        placeholder="send message..."
        autocomplete="off"
        autofocus
      />
      <button id="send-button">
        <img src="../assets/send.svg" alt />
      </button>
      <button
        type="button"
        class="no-show"
        @click="$emit('cancelReply')"
        id="cancel-reply"
      >
        <img src="../assets/close.svg" alt />
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "",
  methods: {
    sendMessage() {
      this.$emit("newMessage", {
        text: this.$refs.msgText.value,
        from: "me",
        class: "me",
        createdAt: Date.now(),
        id: ``,
        status: "pending"
      });
      this.$refs.msgText.value = "";
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.chat__footer {
  background: #e6eaee;
  padding: 10px;
  position: relative;
  display: flex;
  flex-shrink: 0;
  button {
    background: transparent;
    border: none;
  }
  form {
    flex-grow: 1;
    display: flex;
    * {
      margin-right: 10px;
    }
    input {
      margin-left: 10px;
      border-radius: 20px;
    }
  }
  input {
    border: none;
    padding: 10px;
    flex-grow: 1;
  }
}
@media (max-width: 600px) {
  .chat__footer {
    flex-direction: column;
    button {
      margin-right: 0;
    }
  }
}

#send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  img {
    width: 40px;
    margin: 0px;
  }
}
#cancel-reply img {
  height: 1rem;
}
</style>
