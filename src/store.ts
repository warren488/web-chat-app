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
  markDOMElementAsRead,
  sortMessageArray,
  markAsReceived,
  scrollBottom2,
  eventWrapper
} from "@/common";

import { eventBus } from "@/common/eventBus";
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
    friendShips: null,
    network: window.navigator.onLine,
    messages: null,
    dataLoaded: false,
    enableSoundNotif: ["true", null].includes(getCookie("soundNotifPref")),
    enableVisualNotif: ["true", null].includes(getCookie("notifPref")),
    dataLoadStarted: false,
    socket: null,
    currChatFriendshipId: "",
    events: [],
    friendshipIds: []
  },
  getters: {
    user: state => state.user,
    messages: state => state.messages,
    events: state => state.events,
    network: state => state.network,
    socketConnected: state => (state.socket ? state.socket.connected : false),
    socket: state => state.socket,
    currChatFriendshipId: state => state.currChatFriendshipId,
    notifAudio: state => new Audio(`/${state.notifAudioFile}`),
    friendShips: state => state.friendShips,
    initFriends: state => state.friendShips === null,
    initMessages: state => state.messages === null
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
        })
        .catch(console.log);
    },
    setUpApp: async context => {
      context.commit("resetState");
      context.state.dataLoadStarted = true;
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

      getUserInfo().then(({ data }) => {
        context.state.user = data;
        console.log(data);
        // basically im trying to run this event as soon as it is safe to call socket.emit
        if (!context.state.socket.connected) {
          context.state.socket.on(
            "connect",
            eventWrapper(() => {
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
                .dispatch("loadMessages", { friendship_id, limit: 10 })
                .then(() => {
                  /** so these are so many listeners we are adding fot the connect event
                   * althoughg it only fires once hmmmm....
                   * maybe we dont need to attach these listeners after we get all messages (but i think we do)
                   */
                  if (!context.state.socket.connected) {
                    context.state.socket.on(
                      "connect",
                      eventWrapper(() => {
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
      context.state.socket.on(
        "reconnect",
        eventWrapper((...args) => {
          let checkinData = {};
          context.state.friendshipIds.forEach(id => {
            if (context.state.messages[id]) {
              checkinData[id] =
                context.state.messages[id][
                  context.state.messages[id].length - 1
                ];
            } else {
              checkinData[id] = null;
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
              /** figure out if we should scroll to force it later since our function wont work well with multiple new messages */
              if (chatBody) {
                shouldScroll = scrollBottom2({
                  element: chatBody,
                  force: false,
                  test: true
                });
              }
              for (let friendship_id in newMessages) {
                newMessages[friendship_id].sort(sortMessageArray);
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
            })
            .catch(console.log);
          console.log("reconnect", args);
        })
      );
      context.state.socket.on(
        "disconnect",
        eventWrapper((...args) => {
          console.log("disconnect", args);
        })
      );

      context.state.socket.on(
        "newMessage",
        eventWrapper(async data => {
          await context.dispatch("socketNewMessageHandler", data);
        })
      );
      context.state.socket.on(
        "received",
        eventWrapper(
          async data => await context.dispatch("socketReceivedHandler2", data)
        )
      );
      context.state.socket.on(
        "sweep",
        eventWrapper(
          async data => await context.dispatch("socketSweepHandler2", data)
        )
      );
      context.state.socket.on(
        "newFriend",
        eventWrapper(
          async data => await context.dispatch("socketNewFriendHandler", data)
        )
      );
      context.state.socket.on(
        "newFriendRequest",
        eventWrapper(
          async data =>
            await context.dispatch("socketNewFriendRequestHandler", data)
        )
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
          meta: data.meta,
          linkPreview: data.linkPreview,
          url: data.url
        }
      });
      context.commit("updateLastMessage", {
        friendship_id: data.friendship_id,
        lastMessage: data
      });
      // context.commit("incrementNotificationCount", {
      //   friendship_id: data.friendship_id
      // });
      /** let the next user know that this message is green ticked */
      /** if we are signed in on multiple devices only tick if the message isnt coming from us */
      if (data.fromId !== context.state.user.id) {
        context.state.socket.emit("gotMessage", {
          friendship_id: data.friendship_id,
          token: getCookie("token"),
          Ids: data.Ids,
          createdAt: data.createdAt
        });
      }
    },
    socketSweepHandler2(
      context,
      { range, friendship_id, fromId: sweepEventFromId }
    ) {
      if (sweepEventFromId === context.state.user.id) {
        return;
      }
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
        if (message.fromId === context.state.user.id) {
          message.status = "received";
          let messageNode = document.getElementById(message._id);
          if (messageNode) {
            messageNode.classList.remove("pending");
            messageNode.classList.remove("sent");
            messageNode.classList.add("received");
          }
        }
      }
    },
    socketReceivedHandler2(context, { friendship_id, Id, createdAt }) {
      let index = binaryCustomSearch(context.state.messages[friendship_id], {
        createdAt
      });
      if (typeof index === "number") {
        const message = context.state.messages[friendship_id][index];
        if (message._id === Id) {
          message.status = "received";
          markDOMElementAsRead(Id);
        } else {
          // this case means we must have multiple messages with the same timestamp
          const messages = context.state.messages[friendship_id];
          let found = false;
          // loop up while messages still have identical timestamps
          for (let i = index; i < messages.length; i++) {
            if (messages[i].createdAt === createdAt) {
              if (messages[i]._id === Id) {
                messages[i].status = "received";
                markDOMElementAsRead(Id);
                found = true;
                // break if we find the message to mark
                break;
              }
            } else {
              // break if we are no longer looping through messages with the same createdAt
              break;
            }
          }
          if (!found) {
            // loop down while messages still have identical timestamps
            for (let i = index; i >= 0; i--) {
              if (messages[i].createdAt === createdAt) {
                if (messages[i]._id === Id) {
                  messages[i].status = "received";
                  markDOMElementAsRead(Id);
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
        }
      }
    },
    /** @todo this needs error handling */
    /** @todo this works with polling events before initial connect but what about reconnect */
    emitEvent(context, { eventName, data }) {
      return new Promise((resolve, reject) => {
        if (!context.state.socket.connected) {
          context.state.socket.on(
            "connect",
            eventWrapper(() => {
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
    }
  },
  // todo: check if this is returns a promise or is synchronous
  mutations: {
    resetState: (state, data) => {
      state.friendShips = null;
      state.messages = null;
      state.dataLoaded = false;
      state.dataLoadStarted = false;
      state.socket = null;
      state.currChatFriendshipId = "";
      state.friendshipIds = [];
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
    setFriendShips(state, friendShips) {
      state.friendShips = friendShips;
    },
    setfriendshipIds(state, friendshipIds) {
      state.friendshipIds = friendshipIds;
    },
    setCurrentChat(state, friendship_id) {
      state.currChatFriendshipId = friendship_id;
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
      state.friendShips.splice(index, 1, state.friendShips[index]);
    },
    addEvent(state, event) {
      state.events.push(event);
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
    addBulkPreSortedMessages(state, { friendship_id, messages }) {
      state.messages[friendship_id].splice(
        state.messages[friendship_id].length,
        0,
        ...messages
      );
    },
    updateSentMessage(state, data) {
      state.messages[data.friendship_id][data.index]._id = data.id;
      state.messages[data.friendship_id][data.index].status = "sent";
      state.messages[data.friendship_id][data.index].createdAt = data.createdAt;
      state.messages[data.friendship_id].sort(sortMessageArray);
    },
    updateReceivedMessage(state, data) {
      state.messages[data.friendship_id][data.index].status = "received";
    }
  }
});

/** @todo emit event when the data has been loaded */
