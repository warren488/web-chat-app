import Vue from 'vue';
import Vuex from 'vuex';
import { getFriends } from '@/common';

/**
 * @fixme - update state to always hold the current friendship ID and a reference to that friend
 * so we dont have to constantly search
 */
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
          context.commit('setFriends', data);
          return true;
        })
        .catch(err => {
          return false;
        });
    }
  },
  mutations: {
    setFriends(state, friends) {
      state.friends = friends;
    },
    updateLastMessage(state, { friendship_id, lastMessage }) {
      let index = state.friends.findIndex(friend => {
        return friend._id === friendship_id;
      });
      state.friends[index].lastMessage[0] = lastMessage;
      /**
       * @fixme this is a terrible way of getting vue to recognize that something has changed ideally I need to find the proper vue way to do this
       * */
      state.friends.splice(index, 1, state.friends[index]);
    },
    /**
     *
     * @param state
     * @param param1 the friendship id that we want to temporarily (hopefully) set the last message to typing
     */
    showTyping(state, friendship_id) {
      let index = state.friends.findIndex(friend => {
        return friend._id === friendship_id;
      });
      state.friends[index].lastMessage.unshift({
        text: 'typing...',
        status: 'typing'
      });
      /**
       * @fixme this is a terrible way of getting vue to recognize that something has changed ideally I need to find the proper vue way to do this
       * */
      state.friends.splice(index, 1, state.friends[index]);
    },
    hideTyping(state, friendship_id) {
      let index = state.friends.findIndex(friend => {
        return friend._id === friendship_id;
      });
      if(!(state.friends[index].lastMessage[0].status === 'typing')){
        return
      }
      state.friends[index].lastMessage.shift();
      /**
       * @fixme this is a terrible way of getting vue to recognize that something has changed ideally I need to find the proper vue way to do this
       * */
      state.friends.splice(index, 1, state.friends[index]);
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
