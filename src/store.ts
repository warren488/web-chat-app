import Vue from "vue";
import Vuex from "vuex";
import { getFriends } from "@/common";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    friends: null,
    messages: null
  },
  getters: {
    allMessages: state => {
      return state.messages;
    },
    friends: state => {
      return state.friends;
    },
    initFriends: state => {
      if (state.friends === null) {
        return false;
      }
      return true;
    },
    initMessages: state => {
      if (state.messages === null) {
        return false;
      }
      return true;
    }
  },
  actions: {
    setFriends: (context, data) => {
      return getFriends()
        .then(({ data }) => {
          context.commit("setFriends", data);
          return true;
        })
        .catch(err => {
          return false;
        });
    }
  },
  mutations: {
    setFriends(state, friends) {
      console.log(friends);
      state.friends = friends;
    },
    setMessages(state, messages) {
      state.messages = messages;
    },
    addMessage(state, data) {
      if (state.messages !== null) {
        state.messages[data.friendship_id].push(data.message);
      }
    }
  }
});
