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
  clearNotifications
} from "@/common";

import { eventBus } from "@/common/eventBus";
import io from "socket.io-client";
import { Notyf } from "notyf";

/**
 * @fixme - update state to always hold the current friendship ID and a reference to that friend
 * so we dont have to constantly search
 */
Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    notifAudioFile: getCookie("notifAudioFile") || "juntos.mp3",
    user: null,
    oneTimeListeners: new Map(),
    friendShips: null,
    network: window.navigator.onLine,
    focused: document.visibilityState === "visible",
    messages: null,
    dataLoaded: false,
    enableSoundNotif: ["true", null].includes(getCookie("soundNotifPref")),
    enableVisualNotif: ["true", null].includes(getCookie("notifPref")),
    dataLoadStarted: false,
    socket: null,
    currChatFriendshipId: "",
    currChatMessages: [],
    updateQueue: [],
    events: [],
    friendshipIds: [],
    unreads: {},
    homeView: "chatlist",
    checkinActive: false,
    showPopupNotif: false,
    playlists: new Map()
  },
  getters: {
    user: state => state.user,
    homeView: state => state.homeView,
    dataLoaded: state => state.dataLoaded,
    unreads: state => state.unreads,
    messages: state => state.messages,
    events: state => state.events,
    network: state => state.network,
    socketConnected: state => (state.socket ? state.socket.connected : false),
    socket: state => state.socket,
    currChatFriendshipId: state => state.currChatFriendshipId,
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
    setFriendShips: (context, data) => {
      return getFriendShips()
        .then(({ data, friendshipIds }) => {
          context.commit("setFriendShips", data);
          context.commit("setfriendshipIds", friendshipIds);
          return true;
        })
        .catch(err => {
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
      const url = new URL(window.location.href);
      const chat = url.searchParams.get("chat");
      context.commit("resetState");
      context.state.dataLoadStarted = true;
      await context.dispatch("loadNotifications");
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
          context.commit("setCurrentChat", chat);
          context.commit("setHomeView", "chatbody");
        }
        context.state.dataLoaded = true;
        eventBus.dataLoaded();
      });
    },
    attachListeners: context => {
      context.state.socket.on(
        "reconnect",
        eventWrapper("reconnect", (...args) => {
          context.state.checkinActive = true;
          let checkinData = {};
          context.state.friendshipIds.forEach(id => {
            if (context.state.messages[id]) {
              checkinData[id] =
                context.state.messages[id][
                  context.state.messages[id].length - 1
                ];
              // we will need to ask for the updated status of messages that arent read, at this point i will
              // assume that this is almost always going to be a small number so we can simply send all the msgIds
              // in order to make the query simple
              /** no */
              // checkinData[id].unread = [];
              // for (
              //   let i = context.state.messages[id].length - 1;
              //   i > context.state.messages[id].length - 50 && i <= 0;
              //   i--
              // ) {
              //   if (context.state.messages[id][i].status !== "read") {
              //     checkinData[id].unread.push(
              //       context.state.messages[id][i].msgId
              //     );
              //   }
              // }
            }
          });
          context
            .dispatch("emitEvent", {
              eventName: "masCheckin",
              data: checkinData
            })
            .then(newMessages => {
              /** @todo scrolling behaviour doesnt feel like it should be here */
              let shouldScroll;
              let chatBody = document.querySelector(`.chat__main`);
              /** figure out if we should scroll to force it later since
               *  our function wont work well with multiple new messages */
              if (chatBody) {
                shouldScroll = scrollBottom2({
                  element: chatBody,
                  force: false,
                  test: true
                });
              }
              for (let friendship_id in newMessages) {
                newMessages[friendship_id].sort(sortMessageArray);
                newMessages[friendship_id] = newMessages[friendship_id].map(
                  message => {
                    if (message.fromId !== context.state.user.id) {
                      if (
                        context.state.focused &&
                        friendship_id === context.state.currChatFriendshipId
                      ) {
                        /**
                         * no need to update the dom nodes because these are messages
                         * received by me so we dont show the status this is mainly
                         * for the unread count
                         */
                        message.status = "read";
                      } else {
                        context.commit("incUnread", { friendship_id });
                      }
                    }
                    return message;
                  }
                );
                context.commit("addBulkPreSortedMessages", {
                  friendship_id,
                  messages: newMessages[friendship_id]
                });
                markAsReceived(friendship_id, [
                  newMessages[friendship_id][0].createdAt,
                  newMessages[friendship_id][
                    newMessages[friendship_id].length - 1
                  ].createdAt
                ]);
                context.commit("updateLastMessage", {
                  friendship_id,
                  lastMessage:
                    newMessages[friendship_id][
                      newMessages[friendship_id].length - 1
                    ]
                });
              }
              if (shouldScroll)
                scrollBottom2({
                  element: chatBody,
                  force: true,
                  test: false
                });
              context.state.checkinActive = false;
            })
            .catch(err => {
              console.log;
              context.state.checkinActive = false;
            });
        })
      );
      context.state.socket.on(
        "newMessage",
        eventWrapper("newMessage", async data => {
          await context.dispatch("socketNewMessageHandler", data);
        })
      );
      context.state.socket.on(
        "received",
        eventWrapper(
          "received",
          async data => await context.dispatch("socketReceivedHandler2", data)
        )
      );
      context.state.socket.on(
        "sweep",
        eventWrapper(
          "sweep",
          async data => await context.dispatch("socketSweepHandler2", data)
        )
      );
      context.state.socket.on(
        "newFriend",
        eventWrapper(
          "newFriend",
          async data => await context.dispatch("socketNewFriendHandler", data)
        )
      );
      context.state.socket.on(
        "newFriendRequest",
        eventWrapper(
          "newFriendRequest",
          async data =>
            await context.dispatch("socketNewFriendRequestHandler", data)
        )
      );
      context.state.socket.on("pauseVideo", eventWrapper("pauseVideo", null));
      context.state.socket.on("playVideo", eventWrapper("playVideo", null));
      context.state.socket.on(
        "playListUpdated",
        eventWrapper("playListUpdated", null)
      );
      context.state.socket.on(
        "acceptedWatchRequest",
        eventWrapper("acceptedWatchRequest", null)
      );
      context.state.socket.on(
        "watchSessRequest",
        eventWrapper("watchSessRequest", null)
      );
    },
    socketNewFriendHandler: (context, data) => {
      context.state.friendShips.push({
        ...data.friendshipData,
        lastMessage: []
      });
      context.state.messages[data.friendshipData._id] = [];
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
    socketNewMessageHandler: (context, { token, data }) => {
      if (token === getCookie("token")) {
        return;
      }
      /** if we get a message about the other persons typing */
      if (data.type === "typing") {
        // if its saying the person has started typing
        if (data.status === "start") {
          context.commit("showTyping", data.friendship_id);
          if (data.friendship_id === context.state.currChatFriendshipId) {
            document.querySelector(".typing").classList.remove("op");
          }
          // if its saying the person has stopped typing
        } else if (data.status === "stop") {
          context.commit("hideTyping", data.friendship_id);
          if (data.friendship_id === context.state.currChatFriendshipId) {
            document.querySelector(".typing").classList.add("op");
          }
        }
        return;
      }
      if (context.state.showPopupNotif) {
        let notification = new Notyf({
          duration: 5000,
          dismissible: true,
          position: { x: "right", y: "bottom" }
        });
        notification.success(`${data.from}: ${data.text}`);
      }
      if (context.state.enableSoundNotif) {
        context.getters.notifAudio.play();
      }
      if (context.state.enableVisualNotif) {
        notifyMe({ from: data.from, message: data.text });
      }
      const read =
        context.state.focused &&
        data.friendship_id === context.state.currChatFriendshipId;

      let messageStatus;
      /**
       * @todo have a queue where we can store events that are to update the message
       * status, where these events come in before the actual message
       */
      if (data.fromId === context.state.user.id) {
        messageStatus = "sent";
      } else {
        messageStatus = read ? "read" : "receieved";
      }
      const newMessage = {
        friendship_id: data.friendship_id,
        message: {
          createdAt: data.createdAt,
          from: data.from,
          text: data.text,
          msgId: data.msgId,
          _id:
            data.fromId === context.state.user.id
              ? data.Ids.senderId
              : data.Ids.receiverId,
          quoted: data.quoted,
          fromId: data.fromId,
          type: data.type,
          media: data.media,
          meta: data.meta,
          linkPreview: data.linkPreview,
          url: data.url,
          /** @todo this does not go with the typical schema values for status */
          status: messageStatus
        }
      };
      context.state.updateQueue.forEach(event => {
        if (
          event.msgId === newMessage.message.msgId &&
          newMessage.message.status !== "read"
        ) {
          newMessage.message.status = event.read ? "read" : "received";
        }
      });
      context.commit("appendMessageToChat", newMessage);
      context.commit("updateLastMessage", {
        friendship_id: data.friendship_id,
        lastMessage: data
      });
      /** let the next user know that this message is green ticked */
      /** if we are signed in on multiple devices only tick if the message isnt coming from us */
      if (data.fromId !== context.state.user.id) {
        context.state.socket.emit("gotMessage", {
          friendship_id: data.friendship_id,
          token: getCookie("token"),
          msgId: data.msgId,
          createdAt: data.createdAt,
          read
        });
      }
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
      state.dataLoaded = false;
      state.dataLoadStarted = false;
      state.socket = null;
      state.currChatFriendshipId = "";
      state.friendshipIds = [];
    },
    enablePopupNotif(state) {
      state.showPopupNotif = true;
    },
    disablePopupNotif(state) {
      state.showPopupNotif = false;
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
    setHomeView(state, view) {
      state.homeView = view;
    },
    setFriendShips(state, friendShips) {
      state.friendShips = friendShips;
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
    setCurrentChat(state, friendship_id) {
      state.currChatFriendshipId = friendship_id;
      if (friendship_id === "") {
        state.currChatMessages = [];
        return;
      }
      if (isInChat(friendship_id)) {
        /** @todo tell the server to mark all these as read  */
        state.messages[friendship_id] = markLocalChatMessagesAsRead(
          state.messages[friendship_id],
          state.user.id
        );
        state.unreads[friendship_id] = 0;
        if (state.messages[friendship_id].length > 0) {
          markAsReceived(friendship_id, [
            state.messages[friendship_id][0].createdAt,
            state.messages[friendship_id][
              state.messages[friendship_id].length - 1
            ].createdAt
          ]);
        }
        clearNotifications({ tag: friendship_id });
      }
      console.log("storeeeeeeeeee", state.messages[friendship_id]);
      state.currChatMessages = state.messages[friendship_id];
    },
    setChat(state, { friendship_id, data }) {
      state.messages[friendship_id] = data;
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
      if (!isInChat) {
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
