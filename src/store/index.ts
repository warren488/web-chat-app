import Vue from "vue";
import Vuex from "vuex";
import {
  getFriendShips,
  getMessages,
  getCookie,
  baseURI,
  notifyMe,
  getUserInfo,
  setCookie,
  binaryCustomSearch,
  updateDOMMessageStatus,
  sortMessageArray,
  markAsReceived,
  scrollBottom2,
  eventWrapper,
  getNotifications,
  countUnreads,
  isInChat,
  markLocalChatMessagesAsRead,
  clearNotifications,
  checkAndLoadAppUpdate,
  sortByCreatedAt
} from "@/common";

import { eventBus } from "@/common/eventBus";
import io from "socket.io-client";
import { Notyf } from "notyf";
import appState from "./modules/appState";
import appData from "./modules/appData";
import { openDB, deleteDB, wrap, unwrap } from "idb";
/**
 * @fixme - update state to always hold the current friendship ID and a reference to that friend
 * so we dont have to constantly search
 */
Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    appState,
    appData
  },
  state: {
    messageNotification: new Notyf({
      duration: 5000,
      dismissible: true,
      position: { x: "right", y: "bottom" }
    }),
    notifAudioFile: getCookie("notifAudioFile") || "juntos.mp3",
    user: null,
    oneTimeListeners: new Map(),
    friendShips: null,
    messages: null,
    enableSoundNotif: ["true", null].includes(getCookie("soundNotifPref")),
    enableVisualNotif: ["true", null].includes(getCookie("notifPref")),
    socket: null,
    currChatMessages: [],
    updateQueue: [],
    events: {},
    friendshipIds: [],
    unreads: {},
    // is top level await well supported?
    db: openDB("app", 1, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains("friendShips"))
          db.createObjectStore("friendShips", { keyPath: "_id" });
      },
      blocked() {
        console.log("blocked");
      },
      blocking() {
        console.log("blocking");
      },
      terminated() {
        console.log("terminated");
      }
    }),
    checkinActive: false,
    playlists: new Map()
  },
  getters: {
    user: state => state.user,
    unreads: state => state.unreads,
    messages: state => state.messages,
    events: state => state.events,
    socketConnected: state => (state.socket ? state.socket.connected : false),
    socket: state => state.socket,
    currChatMessages: state => state.currChatMessages,
    notifAudio: state => new Audio(`/${state.notifAudioFile}`),
    friendShips: state => state.friendShips,
    initFriends: state => state.friendShips === null,
    initMessages: state => state.messages === null,
    playlist: state => state.playlists
  },
  actions: {
    setNotifAudioFile: (context, file) => {
      context.state.notifAudioFile = file;
      setCookie("notifAudioFile", file, 1000000);
    },
    async setFriendShips(context, data) {
      return getFriendShips()
        .then(async ({ data, friendshipIds }) => {
          context.commit("setFriendShips", data);
          context.commit("setfriendshipIds", friendshipIds);
          return true;
        })
        .catch(async err => {
          // what if it fails for non netwok reasons after commiting some/all of the data to the store
          await context.state.db.getAll("friendShips").then((data: any[]) => {
            context.commit("setFriendShips", data.sort(sortByCreatedAt));
            context.commit("setfriendshipIds", data.map(({ _id }) => _id));
          });
          return false;
        });
    },
    loadMessages: async (context, { friendship_id, limit = 50 }) => {
      return getMessages(friendship_id, limit)
        .then(({ data }) => {
          context.commit("setChat", { friendship_id, data });
          const unreads = countUnreads({
            chat: data,
            user_id: context.state.user.id
          });
          context.commit("addUnreads", { friendship_id, unreads });
        })
        .catch(console.log);
    },
    loadNotifications: async context => {
      return getNotifications()
        .then(({ data }) => {
          console.log(data);
          context.commit("storeEvents", data);
        })
        .catch(console.log);
    },
    setUpApp: async context => {
      if (process.env.NODE_ENV == "production") {
        checkAndLoadAppUpdate();
      }
      // NB: TODO: THIS IS ONE OF IF NOT THE ONLY PLACE WE SHOULD BE MUTATING STATE IN ACTIONS
      context.state.db = await context.state.db;

      const url = new URL(window.location.href);
      const chat = url.searchParams.get("chat");
      context.commit("resetState");
      context.commit("setDataLoadSarted");
      // await context.dispatch("loadNotifications");
      if (context.state.friendShips === null) {
        await context.dispatch("setFriendShips");
      }
      if (context.state.messages === null) {
        context.state.messages = {};
      }
      context.state.socket = io(baseURI, { forceNew: true });
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
       *  - we will attach multiple "connected" listeners for each of the friendShips, which could be a lot.
       *  - have the option of just waiting for the messages to load and loop through the friendShips again
       *    to emit the checking
       *  - allows for everything to load possible faster if loading the messages doesnt have to wait
       *  -
       */

      await getUserInfo().then(({ data }) => {
        // context.state.db.put("users", data)
        context.state.user = data;
        console.log(data);
        // basically im trying to run this event as soon as it is safe to call socket.emit
        if (!context.state.socket.connected) {
          context.state.socket.on(
            "connect",
            eventWrapper("connect", () => {
              context.state.socket.emit("checkin", {
                // @ts-ignore
                userId: data.id,
                token: getCookie("token")
              });
            })
          );
        } else {
          context.state.socket.emit("checkin", {
            // @ts-ignore
            userId: data.id,
            token: getCookie("token")
          });
        }
        context.state.friendShips &&
          context.state.friendShips.forEach(friendShip => {
            let friendship_id = friendShip._id;
            promiseArr.push(
              context
                .dispatch("loadMessages", { friendship_id, limit: 30 })
                .then(() => {
                  /** so these are so many listeners we are adding fot the connect event
                   * althoughg it only fires once hmmmm....
                   * maybe we dont need to attach these listeners after we get all messages (but i think we do)
                   */
                  if (!context.state.socket.connected) {
                    context.state.socket.on(
                      "connect",
                      eventWrapper("connect", () => {
                        context.state.socket.emit("checkin", {
                          friendship_id,
                          token: getCookie("token")
                        });
                      })
                    );
                  } else {
                    context.state.socket.emit("checkin", {
                      friendship_id,
                      token: getCookie("token")
                    });
                  }
                  return;
                })
            );
          });
      });

      await Promise.all(promiseArr).then(promises => {
        if (chat) {
          context.dispatch("setCurrentChat", chat);
          context.commit("setHomeView", "chatbody");
        }
        context.commit("setDataLoadedTrue");
      });
    },
    socketNewFriendHandler: (context, data) => {
      context.commit("pushNewFriendship", {
        ...data.friendshipData,
        lastMessage: []
      });
      context.commit("setChat", {
        friendship_id: data.friendshipData._id,
        data: []
      });
      context.state.socket.emit("checkin", {
        friendship_id: data.friendshipData._id,
        token: getCookie("token")
      });
      eventBus.$emit("newFriend", data);
    },
    socketNewFriendRequestHandler: (context, data) => {
      eventBus.$emit("newFriendRequest", data);
      context.state.user.interactions.receivedRequests.push(data);
    },
    socketSweepHandler2(
      context,
      { range, friendship_id, fromId: sweepEventFromId, read }
    ) {
      let startIndex;
      let result = binaryCustomSearch(context.state.messages[friendship_id], {
        createdAt: range[0]
      });
      if (typeof result === "number") {
        startIndex = result;
      } else if (result.gt !== -1) {
        startIndex = result.gt + 1;
      } else {
        startIndex = result.lt;
      }
      for (
        let i = startIndex;
        i < context.state.messages[friendship_id].length;
        i++
      ) {
        const message = context.state.messages[friendship_id][i];
        /** if we reach the end of the range then break out of the loop */
        if (message.createdAt > range[1]) {
          break;
        }
        if (message.fromId !== sweepEventFromId && message.status !== "read") {
          context.commit("updateMessageStatus", {
            friendship_id,
            index: i,
            status: read ? "read" : "received"
          });
          // this is needed because the computed property does a check for the messages as a group and doesnt detect these changes
          updateDOMMessageStatus(message.msgId, read);
        }
      }
    },
    /**
     * @function socketReceivedHandler2
     *  @NB this function is run when we say to the server yes we got this message
     * the server sends the event that triggers this method, do we need to run this
     * for messages sent by us? it can be useful when on multiple devices, so the server
     * will tell our other devices, hey this message was received/read on another device
     */
    socketReceivedHandler2(context, { friendship_id, msgId, createdAt, read }) {
      console.log("received somewhere");

      let index = binaryCustomSearch(context.state.messages[friendship_id], {
        createdAt
      });
      const messageStatus = read ? "read" : "received";
      if (typeof index === "number") {
        const message = context.state.messages[friendship_id][index];
        // is the id of the message we found the same as the one we're trying to update
        if (message.msgId === msgId) {
          context.commit("updateMessageStatus", {
            friendship_id,
            index,
            status: messageStatus
          });
          updateDOMMessageStatus(msgId, read);
        } else {
          // this case means we must have multiple messages with the same timestamp
          const messages = context.state.messages[friendship_id];
          let found = false;
          // loop up while messages still have identical timestamps
          for (let i = index; i < messages.length; i++) {
            if (messages[i].createdAt === createdAt) {
              if (messages[i].msgId === msgId) {
                context.commit("updateMessageStatus", {
                  friendship_id,
                  index: i,
                  status: messageStatus
                });
                updateDOMMessageStatus(msgId, read);
                found = true;
                // break if we find the message to mark
                break;
              }
            } else {
              // break if we are no longer looping through messages with the same createdAt
              break;
            }
          }
        }
      } else {
        // else if we havent found the message in question
        context.state.updateQueue.push({
          friendship_id,
          msgId,
          createdAt,
          read,
          type: "received"
        });
      }
    },
    /** @todo this needs error handling */
    /** @todo this works with polling events before initial connect but what about reconnect */
    emitEvent(context, { eventName, data }) {
      return new Promise((resolve, reject) => {
        if (!context.state.socket.connected) {
          context.state.socket.on(
            "connect",
            eventWrapper("connect", () => {
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
            })
          );
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
    },
    addOneTimeListener(context, data) {
      context.commit("registerListener", data);
    },
    removeOneTimeListener(context, data) {
      context.commit("removeListener", data);
    }
  },
  // todo: check if this is returns a promise or is synchronous
  mutations: {
    resetState: (state, data) => {
      if (state.socket) {
        state.socket.close();
      }
      state.friendShips = null;
      state.messages = null;
      state.socket = null;
      state.friendshipIds = [];
    },
    registerListener(state, { customName, event, handler }) {
      console.log("registerListener");
      let existingListeners = state.oneTimeListeners.get(event);
      if (!existingListeners) {
        existingListeners = new Map();
      }
      existingListeners.set(customName, handler);
      state.oneTimeListeners.set(event, existingListeners);
    },
    removeListener(state, { customName, event }) {
      console.log("removeListener");
      let existingListeners = state.oneTimeListeners.get(event);
      if (!existingListeners) {
        return;
      }
      existingListeners.delete(customName);
      // not sure if i need to do this
      state.oneTimeListeners.set(event, existingListeners);
    },
    incUnread(state, { friendship_id }) {
      state.unreads = {
        ...state.unreads,
        [friendship_id]: state.unreads[friendship_id]++
      };
    },
    pushNewFriendship(state, friendship) {
      state.friendShips.push(friendship);
      state.db.add("friendShips", friendship);
    },
    addUnreads(state, { friendship_id, unreads }) {
      state.unreads = {
        ...state.unreads,
        [friendship_id]: unreads
      };
    },
    incrementNotificationCount(state, { friendId, friendship_id }) {
      let targetFriend;
      state.friendShips.forEach(friend => {
        if (friend.id === friendId || friend._id === friendship_id) {
          targetFriend = friend;
        }
      });
      if ("notificationCount" in targetFriend) {
        targetFriend.notificationCount++;
      } else {
        // assume there were no notifications before so just set it to 1
        targetFriend.notificationCount = 1;
      }
    },
    addPlaylist(state, playlist) {
      state.playlists.set(playlist.uuid, playlist);
    },
    setFriendShips(state, friendShips) {
      state.friendShips = friendShips;
      const tx = state.db.transaction("friendShips", "readwrite");
      Promise.all([
        ...friendShips.map(friendship => tx.store.put(friendship)),
        tx.done
      ]);
    },
    setfriendshipIds(state, friendshipIds) {
      state.friendshipIds = friendshipIds;
    },
    markLocalChatMessagesAsRead(state, { friendship_id }) {
      /** @todo tell the server to mark all these as read  */
      state.messages[friendship_id] = markLocalChatMessagesAsRead(
        state.messages[friendship_id],
        state.user.id
      );
      state.unreads[friendship_id] = 0;
    },
    setChat(state, { friendship_id, data }) {
      state.messages[friendship_id] = data;
      // state.db.put("messages" )
    },
    updateLastMessage(state, { friendship_id, lastMessage }) {
      let index = state.friendShips.findIndex(friend => {
        return friend._id === friendship_id;
      });
      state.friendShips[index].lastMessage[0] = lastMessage;
      /**
       * @fixme this is a terrible way of getting vue to recognize that something has changed ideally I need to find the proper vue way to do this
       * */
      state.friendShips.unshift(state.friendShips[index]);
      state.friendShips.splice(index + 1, 1);
      state.db.put("friendShips", state.friendShips[0]);
    },
    addEvent(state, event) {
      if (state.events[event.type]) {
        state.events[event.type].push(event);
      }
      console.log("events", state.events);
    },
    storeEvents(state, events) {
      state.events = { ...events };
      console.log("events", state.events);
    },
    showTyping(state, friendship_id) {
      let index = state.friendShips.findIndex(friend => {
        return friend._id === friendship_id;
      });
      if (
        !state.friendShips[index].lastMessage[0] ||
        state.friendShips[index].lastMessage[0].status !== "typing"
      ) {
        state.friendShips[index].lastMessage.unshift({
          text: "typing...",
          status: "typing"
        });
      }
      /**
       * @fixme this is a terrible way of getting vue to recognize that something has changed ideally I need to find the proper vue way to do this
       * */
      state.friendShips.splice(index, 1, state.friendShips[index]);
    },
    hideTyping(state, friendship_id) {
      let index = state.friendShips.findIndex(friend => {
        return friend._id === friendship_id;
      });
      if (
        !(
          state.friendShips[index].lastMessage[0] &&
          state.friendShips[index].lastMessage[0].status === "typing"
        )
      ) {
        return;
      }
      state.friendShips[index].lastMessage.shift();
      /**
       * @fixme this is a terrible way of getting vue to recognize that something has changed ideally I need to find the proper vue way to do this
       * */
      state.friendShips.splice(index, 1, state.friendShips[index]);
    },
    setMessages(state, messages) {
      state.messages = messages;
      for (const friendship_id in messages) {
        let chatUnreads = countUnreads({
          chat: messages[friendship_id],
          user_id: state.user.id
        });
        state.unreads = {
          ...state.unreads,
          [friendship_id]: chatUnreads
        };
      }
    },
    addGroupToChatSart(state, data) {
      state.messages[data.friendship_id].unshift(...data.messages);
      let chatUnreads = countUnreads({
        chat: state.messages[data.friendship_id],
        user_id: state.user.id
      });
      state.unreads = {
        ...state.unreads,
        [data.friendship_id]: chatUnreads
      };
    },
    appendMessageToChat(state, { friendship_id, message }) {
      if (!isInChat(friendship_id) && message.fromId !== state.user.id) {
        state.unreads = {
          ...state.unreads,
          [friendship_id]: state.unreads[friendship_id] + 1
        };
      }
      return state.messages[friendship_id].push(message);
    },
    addMessage(state, { friendship_id, message }) {
      if (!isInChat(friendship_id)) {
        state.unreads = {
          ...state.unreads,
          [friendship_id]: state.unreads[friendship_id] + 1
        };
      }
      if (state.messages !== null) {
        state.messages[friendship_id].push(message);
      }
    },
    addBulkPreSortedMessages(state, { friendship_id, messages }) {
      state.messages[friendship_id].splice(
        state.messages[friendship_id].length,
        0,
        ...messages
      );
      if (!isInChat(friendship_id)) {
        let chatUnreads = countUnreads({
          chat: state.messages[friendship_id],
          user_id: state.user.id
        });
        state.unreads = {
          ...state.unreads,
          [friendship_id]: chatUnreads
        };
      }
    },
    updateSentMessage(state, data) {
      state.messages[data.friendship_id][data.index]._id = data._id;
      state.messages[data.friendship_id][data.index].msgId = data.msgId;
      /** this can pass because it will only ever update messages we send
       * and its sole purpose is to put the message as 'sent' after we get
       * back the info from the server
       */
      state.messages[data.friendship_id][data.index].status = "sent";
      state.messages[data.friendship_id][data.index].createdAt = data.createdAt;
      state.messages[data.friendship_id].sort(sortMessageArray);
    },
    updateMessageStatus(state, data) {
      let recountUnreads =
        state.messages[data.friendship_id][data.index].status !== "read" &&
        data.status === "read";

      state.messages[data.friendship_id][data.index].status = data.status;
      if (recountUnreads) {
        const unreads = countUnreads({
          chat: state.messages[data.friendship_id],
          user_id: state.user.id
        });
        state.unreads = {
          ...state.unreads,
          [data.friendship_id]: unreads
        };
      }
      updateDOMMessageStatus(
        state.messages[data.friendship_id][data.index].msgId,
        data.status === "read"
      );
    }
  }
});

/** @todo emit event when the data has been loaded */
