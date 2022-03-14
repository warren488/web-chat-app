import {
  clearNotifications,
  eventWrapper,
  getCookie,
  markAsReceived,
  markLocalChatMessagesAsRead,
  notifyMe,
  scrollBottom2,
  sortMessageArray
} from "@/common";
import { eventBus } from "@/common/eventBus";
import { Notyf } from "notyf";

export default {
  state: () => ({
    messageNotification: new Notyf({
      duration: 5000,
      dismissible: true,
      position: { x: "right", y: "bottom" }
    }),
    sharedImage: null
  }),
  getters: {
    sharedImage: state => state.sharedImage
  },
  mutations: {
    setSharedImage(state, data) {
      state.sharedImage = data;
    },
    clearSharedImage(state) {
      state.sharedImage = null;
    }
  },
  actions: {
    attachListeners: context => {
      context.rootState.socket.on(
        "reconnect",
        eventWrapper("reconnect", (...args) => {
          context.rootState.checkinActive = true;
          let checkinData = {};
          context.rootState.friendshipIds.forEach(id => {
            if (context.rootState.messages[id]) {
              checkinData[id] =
                context.rootState.messages[id][
                  context.rootState.messages[id].length - 1
                ];
              // we will need to ask for the updated status of messages that arent read, at this point i will
              // assume that this is almost always going to be a small number so we can simply send all the msgIds
              // in order to make the query simple
              /** no */
              // checkinData[id].unread = [];
              // for (
              //   let i = context.rootState.messages[id].length - 1;
              //   i > context.rootState.messages[id].length - 50 && i <= 0;
              //   i--
              // ) {
              //   if (context.rootState.messages[id][i].status !== "read") {
              //     checkinData[id].unread.push(
              //       context.rootState.messages[id][i].msgId
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
                    if (message.fromId !== context.rootState.user.id) {
                      if (context.getters.isInChat == friendship_id) {
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
              context.rootState.checkinActive = false;
            })
            .catch(err => {
              console.log;
              context.rootState.checkinActive = false;
            });
        })
      );
      context.rootState.socket.on(
        "newMessage",
        eventWrapper("newMessage", async data => {
          await context.dispatch("socketNewMessageHandler", data);
        })
      );
      context.rootState.socket.on(
        "received",
        eventWrapper(
          "received",
          async data => await context.dispatch("socketReceivedHandler2", data)
        )
      );
      context.rootState.socket.on(
        "sweep",
        eventWrapper(
          "sweep",
          async data => await context.dispatch("socketSweepHandler2", data)
        )
      );
      context.rootState.socket.on(
        "newFriend",
        eventWrapper(
          "newFriend",
          async data => await context.dispatch("socketNewFriendHandler", data)
        )
      );
      context.rootState.socket.on(
        "newFriendRequest",
        eventWrapper(
          "newFriendRequest",
          async data =>
            await context.dispatch("socketNewFriendRequestHandler", data)
        )
      );
      context.rootState.socket.on(
        "pauseVideo",
        eventWrapper("pauseVideo", null)
      );
      context.rootState.socket.on("playVideo", eventWrapper("playVideo", null));
      context.rootState.socket.on(
        "playListUpdated",
        eventWrapper("playListUpdated", null)
      );
      context.rootState.socket.on(
        "acceptedWatchRequest",
        eventWrapper("acceptedWatchRequest", null)
      );
      context.rootState.socket.on(
        "watchSessRequest",
        eventWrapper("watchSessRequest", null)
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
          if (
            data.friendship_id ===
            context.rootState.appState.currChatFriendshipId
          ) {
            document.querySelector(".typing").classList.remove("op");
          }
          // if its saying the person has stopped typing
        } else if (data.status === "stop") {
          context.commit("hideTyping", data.friendship_id);
          if (
            data.friendship_id ===
            context.rootState.appState.currChatFriendshipId
          ) {
            document.querySelector(".typing").classList.add("op");
          }
        }
        return;
      }
      if (context.rootState.appState.showPopupNotif) {
        context.state.messageNotification.success(`${data.from}: ${data.text}`);
      }
      if (context.rootState.enableSoundNotif) {
        context.getters.notifAudio.play();
      }
      if (context.rootState.enableVisualNotif) {
        notifyMe({ from: data.from, message: data.text });
      }
      const read = context.getters.isInChat == data.friendship_id;

      let messageStatus;
      /**
       * @todo have a queue where we can store events that are to update the message
       * status, where these events come in before the actual message
       */
      if (data.fromId === context.rootState.user.id) {
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
            data.fromId === context.rootState.user.id
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
      context.rootState.updateQueue.forEach(event => {
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
      if (data.fromId !== context.rootState.user.id) {
        context.rootState.socket.emit("gotMessage", {
          friendship_id: data.friendship_id,
          token: getCookie("token"),
          msgId: data.msgId,
          createdAt: data.createdAt,
          read
        });
      }
    },
    appFocused: context => {
      if (context.rootState.appState.currChatFriendshipId) {
        context.commit("markLocalChatMessagesAsRead", {
          friendship_id: context.rootState.appState.currChatFriendshipId
        });
        const messages =
          context.rootState.messages[
            context.rootState.appState.currChatFriendshipId
          ];
        if (messages && messages.length > 0) {
          markAsReceived(context.rootState.appState.currChatFriendshipId, [
            messages[0].createdAt,
            messages[messages.length - 1].createdAt
          ]);
        }
      }
    },
    setCurrentChat({ state, rootState, getters, commit }, friendship_id) {
      commit("setCurrentChat", friendship_id);
      if (friendship_id === "") {
        rootState.currChatMessages = [];
        return;
      }
      if (getters.isInChat === friendship_id) {
        /** @todo tell the server to mark all these as read  */
        rootState.messages[friendship_id] = markLocalChatMessagesAsRead(
          rootState.messages[friendship_id],
          rootState.user.id
        );
        rootState.unreads[friendship_id] = 0;
        if (rootState.messages[friendship_id].length > 0) {
          markAsReceived(friendship_id, [
            rootState.messages[friendship_id][0].createdAt,
            rootState.messages[friendship_id][
              rootState.messages[friendship_id].length - 1
            ].createdAt
          ]);
        }
        clearNotifications({ tag: friendship_id });
      }
      rootState.currChatMessages = rootState.messages[friendship_id];
    }
  }
};
