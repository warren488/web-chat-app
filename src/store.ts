import Vue from "vue";
import Vuex from "vuex";
import {
  getFriends,
  getMessages,
  getCookie,
  eventBus,
  baseURI,
  notifyMe,
  getUserInfo,
  setCookie
} from "@/common";
import io from "socket.io-client";

/**
 * @fixme - update state to always hold the current friendship ID and a reference to that friend
 * so we dont have to constantly search
 */
Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    notifAudioFile: getCookie("notifAudioFile") || "juntos.mp3",
    user: null,
    friends: null,
    messages: null,
    unreadIndex: {},
    dataLoaded: false,
    enableSoundNotif: ["true", null].includes(getCookie("soundNotifPref")),
    enableVisualNotif: ["true", null].includes(getCookie("notifPref")),
    dataLoadStarted: false,
    socket: null,
    currChat: "",
    friendshipIds: []
  },
  getters: {
    user: state => state.user,
    messages: state => state.messages,
    socket: state => state.socket,
    currChat: state => state.currChat,
    notifAudio: state => new Audio(`/${state.notifAudioFile}`),
    friends: state => state.friends,
    unreadIndex: state => state.unreadIndex,
    initFriends: state => state.friends === null,
    initMessages: state => state.messages === null
  },
  actions: {
    setNotifAudioFile: (context, file) => {
      context.state.notifAudioFile = file;
      setCookie("notifAudioFile", file, 1000000);
    },
    setFriends: (context, data) => {
      return getFriends()
        .then(({ data, friendshipIds }) => {
          context.commit("setFriends", data);
          context.commit("setfriendshipIds", friendshipIds);
          return true;
        })
        .catch(err => {
          return false;
        });
    },
    loadMessages: async (context, { friendship_id, limit = 50 }) => {
      return getMessages(friendship_id, limit)
        .then(({ data, unreadIndex }) => {
          context.state.unreadIndex[friendship_id] = unreadIndex;
          context.commit("setChat", { friendship_id, data });
        })
        .catch(console.log);
    },
    setUpApp: async context => {
      context.commit("resetState");
      context.state.dataLoadStarted = true;
      if (context.state.friends === null) {
        await context.dispatch("setFriends");
      }
      if (context.state.messages === null) {
        context.state.messages = {};
      }
      context.state.socket = io(baseURI);
      await context.dispatch("attachListeners");

      let promiseArr = [];
      /**
       * some interesting problems to solve below, so here they are
       * 1. Do we wait until the socket is connected to load the messages and attach the checkin event?
       *  - this can increase loading time of the app and can overall lead to a slower experience
       *  - maybe in the future we allow for progressive enhancement where the app works without a socket connection??
       *  it can be good because:
       *  - in the case where messages are being sent to us while we are connecting we can be sure that as
       *    soon as we get the messages our socket will be configured immediately reducing the risk of missed messages.
       *
       * 2. let socket connection and message loading happen independently?
       *  - we will attach multiple "connected" listeners for each of the friends, which could be a lot.
       *  - have the option of just waiting for the messages to load and loop through the friends again
       *    to emit the checking
       *  - allows for everything to load possible faster if loading the messages doesnt have to wait
       *  -
       */

      getUserInfo().then(({ data }) => {
        context.state.user = data;
        context.state.friends &&
          context.state.friends.forEach(friend => {
            let friendship_id = friend._id;
            promiseArr.push(
              context
                .dispatch("loadMessages", { friendship_id, limit: 10 })
                .then(() => {
                  /** so these are so many listeners we are adding fot the connect event
                   * althoughg it only fires once hmmmm....
                   * maybe we dont need to attach these listeners after we get all messages (but i think we do)
                   */
                  console.log(`connect ${friendship_id}`);
                  if (!context.state.socket.connected) {
                    context.state.socket.on("connect", () => {
                      context.state.socket.emit("checkin", {
                        friendship_id,
                        token: getCookie("token")
                      });
                    });
                  } else {
                    context.state.socket.emit("checkin", {
                      friendship_id,
                      token: getCookie("token")
                    });
                  }
                })
            );
          });
      });

      promiseArr.push();
      await Promise.all(promiseArr).then(promises => {
        context.state.dataLoaded = true;
        eventBus.dataLoaded();
      });
    },
    attachListeners: context => {
      context.state.socket.on("reconnect", (...args) => {
        context.dispatch("emitEvent", {
          eventName: "masCheckin",
          data: context.state.friendshipIds
        });
        console.log("reconnect", args);
      });
      context.state.socket.on("disconnect", (...args) => {
        console.log("disconnect", args);
      });

      context.state.socket.on("newMessage", async data => {
        console.log("newmessage");
        await context.dispatch("socketNewMessageHandler", data);
      });
      context.state.socket.on(
        "received",
        async data => await context.dispatch("socketReceivedHandler", data)
      );
      context.state.socket.on(
        "sweep",
        async data => await context.dispatch("socketSweepHandler", data)
      );
    },
    socketNewMessageHandler: (context, { token, data }) => {
      if (token === getCookie("token")) {
        return;
      }
      /** if we get a message about the other persons typing */
      if (data.type === "typing") {
        // if its saying the person has started typing
        if (data.status === "start") {
          context.commit("showTyping", data.friendship_id);
          if (data.friendship_id === context.state.currChat) {
            document.querySelector(".typing").classList.remove("op");
          }
          // if its saying the person has stopped typing
        } else if (data.status === "stop") {
          context.commit("hideTyping", data.friendship_id);
          if (data.friendship_id === context.state.currChat) {
            document.querySelector(".typing").classList.add("op");
          }
        }
        return;
      }
      if (context.state.enableSoundNotif) {
        context.getters.notifAudio.play();
      }
      if (context.state.enableVisualNotif) {
        notifyMe({ from: data.from, message: data.text });
      }

      context.commit("appendMessageToChat", {
        friendship_id: data.friendship_id,
        message: {
          createdAt: data.createdAt,
          from: data.from,
          text: data.text,
          _id: data.Ids[0],
          quoted: data.quoted,
          fromId: data.fromId,
          type: data.type,
          media: data.media,
          url: data.url
        }
      });
      context.commit("updateLastMessage", {
        friendship_id: data.friendship_id,
        lastMessage: data
      });
      /** let the next user know that this message is green ticked */
      /** if we are signed in on multiple devices only tick if the message isnt coming from us */
      if (data.fromId !== context.state.user.id) {
        context.state.socket.emit(
          "gotMessage",
          {
            friendship_id: data.friendship_id,
            token: getCookie("token"),
            Ids: data.Ids
          },
          () => console.log("message ticked")
        );
      }
    },
    socketSweepHandler(context, { range, friendship_id, fromId }) {
      if (fromId === context.state.user.id) {
        return;
      }
      // mark all the indexes within this range as read
      // context.state.unreadIndex[friendship_id].forEach((message, index) => {
      //   if (message.createdAt <= range[0] && message.createdAt >= range[1]) {
      //     console.log(
      //       `sweeping`,
      //       context.state.messages[friendship_id][message.orderedIndex]
      //     );
      //     context.state.messages[friendship_id][message.orderedIndex].status =
      //       "received";
      //     let messageNode = document.getElementById(message._id);
      //     if (messageNode) {
      //       messageNode.classList.remove("pending");
      //       messageNode.classList.remove("sent");
      //       messageNode.classList.add("received");
      //     }
      //   }
      //   // delete the unused element but how will that affect the foreach loop
      // });
      for (
        let i = 0;
        i < context.state.unreadIndex[friendship_id].length;
        i++
      ) {
        const message = context.state.unreadIndex[friendship_id][i];
        if (message.createdAt <= range[0] && message.createdAt >= range[1]) {
          context.state.messages[friendship_id][message.orderedIndex].status =
            "received";
          let messageNode = document.getElementById(message._id);
          if (messageNode) {
            messageNode.classList.remove("pending");
            messageNode.classList.remove("sent");
            messageNode.classList.add("received");
          }
          // remove the current item since its not remove and decrement the iterator
          // since the array length changed
          context.state.unreadIndex[friendship_id].splice(i, 1);
          i--;
        }
      }
    },
    socketReceivedHandler(context, data) {
      console.log("received");
      data.Ids.forEach(Id => {
        context.state.unreadIndex[data.friendship_id].forEach(function(
          unreadMsg,
          indexInUnread
        ) {
          console.log(`${unreadMsg._id} === ${Id}`);
          if (unreadMsg._id === Id) {
            context.commit("updateReceivedMessage", {
              friendship_id: data.friendship_id,
              index: unreadMsg.orderedIndex,
              indexInUnread
            });
          }
        });
        /** @todo this is a pretty bad thing to do i need to check back and see if vue picks up these changes */
        let message = document.getElementById(Id);
        if (message) {
          message.classList.remove("pending");
          message.classList.remove("sent");
          message.classList.add("received");
        }
      });
    },
    /** @todo this needs error handling */
    /** @todo this works with polling events before initial connect but what about reconnect */
    emitEvent(context, { eventName, data }) {
      return new Promise((resolve, reject) => {
        console.log("emit", { eventName, data });

        if (!context.state.socket.connected) {
          context.state.socket.on("connect", () => {
            context.state.socket.emit(
              eventName,
              {
                token: getCookie("token"),
                data
              },
              (err, data) => {
                if (err) reject(err);
                else resolve(data);
              }
            );
          });
        } else {
          context.state.socket.emit(
            eventName,
            {
              token: getCookie("token"),
              data
            },
            (err, data) => {
              if (err) reject(err);
              else resolve(data);
            }
          );
        }
      });
    }
  },
  // todo: check if this is returns a promise or is synchronous
  mutations: {
    resetState: (state, data) => {
      state.friends = null;
      state.messages = null;
      state.unreadIndex = {};
      state.dataLoaded = false;
      state.dataLoadStarted = false;
      state.socket = null;
      state.currChat = "";
      state.friendshipIds = [];
    },
    setFriends(state, friends) {
      state.friends = friends;
    },
    setfriendshipIds(state, friendshipIds) {
      state.friendshipIds = friendshipIds;
    },
    setCurrentChat(state, friendship_id) {
      state.currChat = friendship_id;
    },
    setChat(state, { friendship_id, data }) {
      state.messages[friendship_id] = data;
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
    showTyping(state, friendship_id) {
      let index = state.friends.findIndex(friend => {
        return friend._id === friendship_id;
      });
      if (state.friends[index].lastMessage[0].status !== "typing") {
        state.friends[index].lastMessage.unshift({
          text: "typing...",
          status: "typing"
        });
      }
      /**
       * @fixme this is a terrible way of getting vue to recognize that something has changed ideally I need to find the proper vue way to do this
       * */
      state.friends.splice(index, 1, state.friends[index]);
    },
    hideTyping(state, friendship_id) {
      let index = state.friends.findIndex(friend => {
        return friend._id === friendship_id;
      });
      if (!(state.friends[index].lastMessage[0].status === "typing")) {
        return;
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
    addGroupToChatSart(state, data) {
      state.messages[data.friendship_id].unshift(...data.messages);
    },
    appendMessageToChat(state, data) {
      return state.messages[data.friendship_id].push(data.message);
    },
    addMessage(state, data) {
      if (state.messages !== null) {
        state.messages[data.friendship_id].push(data.message);
      }
    },
    updateSentMessage(state, data) {
      state.messages[data.friendship_id][data.index]._id = data.id;
      state.messages[data.friendship_id][data.index].status = "sent";
      console.log(`update sent ${data.indexInUnread}`);
      if (typeof data.indexInUnread === "number") {
        state.unreadIndex[data.friendship_id][data.indexInUnread]._id = data.id;
        state.unreadIndex[data.friendship_id][data.indexInUnread].status =
          "sent";
      }
    },
    updateReceivedMessage(state, data) {
      state.messages[data.friendship_id][data.index].status = "received";
      if (typeof data.indexInUnread === "number") {
        state.unreadIndex[data.friendship_id].splice(data.indexInUnread, 1);
      }
    },
    pushToUnreadIndex(state, { friendship_id, data }) {
      state.unreadIndex[friendship_id].push(data);
    }
  }
});

/** @todo emit event when the data has been loaded */
