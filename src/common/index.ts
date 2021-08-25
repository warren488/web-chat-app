import axios from "axios";
import {
  AuthResponse,
  RegisterResponse,
  UserInfo,
  UpdatedUserInfo,
  getFriendsResponse
} from "./interfaces";
import * as firebase from "firebase/app";
import "firebase/storage";
import "firebase/auth";
import { Notyf } from "notyf";
import store from "@/store";

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyBD4TjGeZXKw7fWYR8X0UGfHAIvQqzUmF0",
  authDomain: "myapp-4f894.firebaseapp.com",
  databaseURL: "https://myapp-4f894.firebaseio.com",
  projectId: "myapp-4f894",
  storageBucket: "myapp-4f894.appspot.com",
  messagingSenderId: "410181839308",
  appId: "1:410181839308:web:7249de84cc8fdd3cc5d569"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const baseURI = "https://dry-savannah-78912.herokuapp.com";
// export const baseURI = "http://localhost:3000";

let pubKey =
  "BGtw8YFtyrySJpt8TrAIwqU5tlBlmcsdEinKxRKUDdb6fgQAnjVsS9N-ZhpAQzbwf78TMysYrMcuOY6T4BGJlwo";

export const CONSTANTS = Object.freeze({
  sideList: {
    MODES: {
      FRIENDS: 1,
      SEARCH: 2,
      FRIEND_REQUESTS: 3
    }
  }
});
export const clearNotifications = async (searchOptions?: Object) => {
  if ("serviceWorker" in navigator) {
    return navigator.serviceWorker
      .getRegistration("/worker.js")
      .then(registration => {
        if (registration) {
          registration.getNotifications(searchOptions).then(notifications => {
            // since we're searching by tag it should only be one right?
            notifications.forEach(notification => {
              notification.close();
            });
          });
        }
      });
  }
};

export const subscribeToNotif = async () => {
  console.log("subscribing");
  let notification = new Notyf({
    duration: 7000,
    dismissible: true,
    position: { x: "center", y: "top" }
  });
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.register(
        "/worker.js",
        {
          scope: "/"
        }
      );
      await registration.update();
      await requestPermission();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pubKey)
      });
      await fetch(`${baseURI}/api/users/${store.state.user.id}/subscribe`, {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
          "content-type": "application/json",
          "x-auth": getCookie("token")
        }
      });
    }
    notification.success(`successfully subscribed to push notifications`);
  } catch (error) {
    console.log(error);
    let parsedError = error;
    if (error instanceof Error) {
      parsedError = {
        errString: error.toString(),
        stack: error.stack,
        message: error.message
      };
    }
    console.log(parsedError);

    notification.error(
      `there was an error subscribing to the push notifications `
    );
    fetch(`${baseURI}/api/crashreport`, {
      method: "POST",
      body: JSON.stringify({
        error: parsedError,
        userId: store.state.user.id,
        userAgent: navigator.userAgent
      }),
      headers: {
        "content-type": "application/json",
        "x-auth": getCookie("token")
      }
    });
  }
};

export const unsubscribeToNotif = async () => {
  await fetch(`${baseURI}/api/users/${store.state.user.id}/unsubscribe`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-auth": getCookie("token")
    }
  });
};

export const updateDOMMessageStatus = (msgId, read) => {
  let messageElement = document.getElementById(msgId);
  if (messageElement) {
    messageElement.classList.remove("pending");
    messageElement.classList.remove("sent");
    messageElement.classList.remove("received");
    messageElement.classList.add(read ? "read" : "received");
  }
};

export const uploadToFireBase = (file, location?: string) => {
  // Create a root reference
  let storageRef = firebase.storage().ref();
  let extension = file.name.split(".").pop();
  let ref = storageRef.child(
    /** @nb the off chance a users uploads 2 things at the same time? */
    `${location || ""}/${Date.now()}.${extension}`
  );
  return ref.put(file).then(function(snapshot) {
    return snapshot.ref.getDownloadURL();
  });
};

export const addAudioToFirebase = (blob, friendship_id) => {
  var storageRef = firebase.storage().ref();
  var ref = storageRef.child(
    `voicenotes/${store.state.user.id}/${friendship_id}/${Date.now()}`
  );
  return ref.put(blob, { contentType: "audio/webm" }).then(function(snapshot) {
    return snapshot.ref.getDownloadURL();
  });
};

export const signInToFirebase = token => {
  return firebase
    .auth()
    .signInWithCustomToken(token)
    .catch(function(error) {
      // Handle Errors here.
      let errorCode = error.code;
      let errorMessage = error.message;
      console.log(errorCode, errorMessage);
      // ...
    });
};

export const getFirebaseSigninToken = () => {
  return fetch(`${baseURI}/api/users/me/generatefbtoken`, {
    method: "POST",
    headers: {
      "x-auth": getCookie("token")
    }
  }).then(res => res.json());
};

export const signOutOfFirebase = () => {
  return firebase
    .auth()
    .signOut()
    .catch(function(error) {
      // Handle Errors here.
      let errorCode = error.code;
      let errorMessage = error.message;
      console.log(errorCode, errorMessage);
      // ...
    });
};

export function encodeBase64(file) {
  return new Promise((resolve, reject) => {
    var imgReader = new FileReader();
    imgReader.onloadend = function() {
      resolve(imgReader.result);
    };
    imgReader.onerror = reject;
    imgReader.readAsDataURL(file);
  });
}

export const uploadImage = async ({ data, name }) => {
  return await axios({
    method: "POST",
    url: `${baseURI}/api/image`,
    headers: {
      "x-auth": getCookie("token")
    },
    data: { imageData: data, name: name }
  });
};

export const login = async (userData: Object): Promise<AuthResponse> => {
  return await axios({
    method: "POST",
    url: `${baseURI}/api/login`,
    data: userData
  });
};

export const logout = async () => {
  try {
    let data = await axios({
      method: "POST",
      headers: {
        "x-auth": getCookie("token")
      },
      url: `${baseURI}/api/logout`
    });
    await store.commit("resetState");
    await Promise.all([unsubscribeToNotif(), signOutOfFirebase()]);
    setCookie("token", "", -1000);
    setCookie("username", "", -1000);
    return data;
  } catch (error) {
    console.log(error.response);
    if (
      error.response &&
      error.response.data &&
      error.response.data.message === "request authentication failed"
    ) {
      await store.commit("resetState");
      return;
    }
    throw error;
  }
};

export const signup = async (userData: Object): Promise<RegisterResponse> => {
  return await axios({
    method: "POST",
    url: `${baseURI}/api/signup`,
    data: userData
  });
};

export const sortMessageArray = (a, b) => {
  if (a.createdAt > b.createdAt) {
    return 1;
  } else if (a.createdAt < b.createdAt) {
    return -1;
  } else {
    return 0;
  }
};

export const checkusername = async (username): Promise<Boolean> => {
  return await axios({
    method: "GET",
    url: `${baseURI}/api/user_exists?username=${username}`
  }).then(res => {
    return !res.data.exists;
  });
};

export const getUserInfo = async (): Promise<UserInfo> => {
  return await axios({
    method: "GET",
    headers: {
      "x-auth": getCookie("token")
    },
    url: `${baseURI}/api/users/me`
  });
};

export const getUsers = async (username): Promise<UserInfo> => {
  return await axios({
    method: "GET",
    headers: {
      "x-auth": getCookie("token")
    },
    url: `${baseURI}/api/users?username=${username}&exclude_me`
  });
};

export const getUserById = async (userId): Promise<UserInfo> => {
  return await axios({
    method: "GET",
    headers: {
      "x-auth": getCookie("token")
    },
    url: `${baseURI}/api/users?user_id=${userId}&exclude_me`
  }).then(({ data }) => data[0]);
};

export function getDimensionsForBox({
  containerWidth,
  containerHeight,
  objectWidth,
  objectHeight
}: {
  containerWidth;
  containerHeight?;
  objectWidth;
  objectHeight;
}): Map<String, Number> {
  let WHRatio = objectWidth / objectHeight;
  let propertyMap = new Map();
  /** if it id wider than it is tall */
  if (!containerHeight) {
    if (WHRatio >= 1) {
      propertyMap.set("width", containerWidth);
      propertyMap.set("height", containerWidth / WHRatio);
      /** @todo expansion logic */
    } else if (WHRatio < 1) {
      propertyMap.set("height", containerWidth);
      propertyMap.set("width", containerWidth * WHRatio);
    }
    return propertyMap;
  }
  /**
   * if the resultant height for the containerWidth we would like to use is within the constrainst
   */
  if (containerWidth / WHRatio < containerHeight) {
    propertyMap.set("width", containerWidth);
    propertyMap.set("height", containerWidth / WHRatio);
    return propertyMap;
  } else {
    /** once we get here then the widrh is guaranteed to be less than the constraint */
    propertyMap.set("height", containerHeight);
    propertyMap.set("width", containerHeight * WHRatio);
    return propertyMap;
  }
}

export const updateInfo = async (
  userData: Object
): Promise<UpdatedUserInfo> => {
  return await axios({
    method: "POST",
    data: userData,
    headers: {
      "x-auth": getCookie("token")
    },
    url: `${baseURI}/api/users/me`
  });
};

export function getCookie(name: string): string | null {
  let exp = new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*\\=\\s*([^;]*).*$)|^.*$`);
  let cookieValue = document.cookie.replace(exp, "$1");
  return cookieValue !== "" ? cookieValue : null;
}

export const getFriendShips = async (): Promise<getFriendsResponse> => {
  return await axios({
    method: "GET",
    headers: {
      "x-auth": getCookie("token")
    },
    url: `${baseURI}/api/users/me/friends`
  }).then(({ data }) => {
    let friendshipIds = [];
    for (const friend of data) {
      friendshipIds.push(friend._id);
    }
    return { data, friendshipIds };
  });
};

export const addFriend = async ({
  username,
  id
}): Promise<getFriendsResponse> => {
  return await axios({
    method: "POST",
    headers: {
      "x-auth": getCookie("token")
    },
    // endpoint will prioritize id
    data: { username, id },
    url: `${baseURI}/api/users/me/friends`
  });
};
export const sendRequest = async (
  friendId: string
): Promise<getFriendsResponse> => {
  return await axios({
    method: "POST",
    headers: {
      "x-auth": getCookie("token")
    },
    data: { friendId },
    url: `${baseURI}/api/users/me/friendRequests`
  });
};

export const setCookie = (name: string, value: string, days: number) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

/**
 * possibly do this on the socket intead
 * currently doing it this way because the socket is a property of the homme component
 * and i also want to call this function immediately inside of get messages (or any function that gets messages)
 * we will not have reference to the inside those functions and i dont know if i want to pass it to them
 * */
export const markAsReceived = async (friendship_id, range) => {
  return await axios({
    method: "POST",
    url: `${baseURI}/io/users/me/${friendship_id}/sweep`,
    headers: {
      "Content-type": "application/json",
      "x-auth": getCookie("token")
    },
    data: {
      range,
      friendship_id,
      read:
        store.state.focused &&
        friendship_id === store.state.currChatFriendshipId
    }
  });
};

export const countUnreads = ({ chat, user_id }) => {
  const unreadLimit = 50;
  let unreads = 0;
  if (chat) {
    const arrLength = chat.length;
    const messages = chat.slice(arrLength - (unreadLimit + 1));
    for (const message of messages) {
      if (message.status !== "read" && message.fromId !== user_id) {
        unreads++;
      }
    }
  }
  console.log(unreads);

  return unreads;
};

export const isInChat = friendship_id => {
  return (
    store.state.focused && friendship_id === store.state.currChatFriendshipId
  );
};

export function markLocalChatMessagesAsRead(messages, userId) {
  /**
   * this is all used in order to keep count of the unread badge that will be on the chat
   * and is not the same as us getting info that the other user has read our messages
   */
  const unreadLimit = 50;
  const start = Math.max(messages.length - unreadLimit, 0);
  for (let i = start; i < messages.length; i++) {
    /** @todo only mark as read if its not sent by me */
    // console.log("markLocalChatMessagesAsRead", messages[i]);
    if (userId !== messages[i].fromId) {
      messages[i].status = "read";
    }
  }
  return messages;
}

export const getNotifications = async () => {
  return await axios({
    method: "GET",
    url: `${baseURI}/api/users/me/notifications`,
    headers: {
      "Content-type": "application/json",
      "x-auth": getCookie("token")
    }
  });
};

export const getMessages = async (
  friendship_id: string,
  limit: number = 50
) => {
  return await axios({
    method: "GET",
    url: `${baseURI}/api/users/me/${friendship_id}/messages?limit=${limit}`,
    headers: {
      "Content-type": "application/json",
      "x-auth": getCookie("token")
    }
  }).then(({ data: messages }) => {
    /** lower limit is earliest message */
    if (messages.length > 0) {
      let recPromise = markAsReceived(friendship_id, [
        messages[0].createdAt,
        messages[messages.length - 1].createdAt
      ]).catch(() => {
        console.log("failed to mark as received");
      });
    }
    return { data: messages };
  });
};

export const getMessagePage = async ({
  friendship_id,
  limit = 50,
  timestamp,
  msgId
}) => {
  return await axios({
    method: "GET",
    url: `${baseURI}/api/users/me/${friendship_id}/messagespage?limit=${limit}&timestamp=${timestamp}&msgId=${msgId}`,
    headers: {
      "Content-type": "application/json",
      "x-auth": getCookie("token")
    }
  }).then(({ data: messages }) => {
    /** remember in data the last message is the first item in the array */
    let recPromise = markAsReceived(friendship_id, [
      messages[0].createdAt,
      messages[messages.length - 1].createdAt
    ]).catch(() => {
      console.log("failed to mark as received");
    });
    return { data: messages };
  });
};

export async function getPreviewData(url) {
  let id = uuid();
  return fetch(`${baseURI}/api/getpreview`, {
    method: "POST",
    body: JSON.stringify({ url, id }),
    headers: {
      "content-type": "application/json",
      "x-auth": getCookie("token")
    }
  }).then(res => res.json());
}

export function uuid() {
  let date = new Date().getTime();
  const randomStrings = c => {
    const r = (date + Math.random() * 16) % 16 | 0;
    date = Math.floor(date / 16);
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  };
  const id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    randomStrings
  );
  return id;
}

export const binaryCustomSearch = function(arr, x) {
  if (!arr || arr.length === 0) {
    return -1;
  }

  let start = 0,
    end = arr.length - 1,
    gt = -1,
    lt = -1;

  // Iterate while start not meets end
  while (start <= end) {
    // Find the mid index
    let mid = Math.floor((start + end) / 2);

    // If element is present at mid, return True
    if (arr[mid].createdAt === x.createdAt) {
      return mid;
    }

    // Else look in left or right half accordingly
    else if (arr[mid].createdAt < x.createdAt) {
      start = mid + 1;
      gt = mid;
    } else {
      end = mid - 1;
      lt = mid;
    }
  }

  return { lt, gt };
};

export const getLastMessage = async (friendship_id: string) => {
  return await axios({
    method: "GET",
    url: `${baseURI}/api/users/me/${friendship_id}/lastmessage`,
    headers: {
      "Content-type": "application/json",
      "x-auth": getCookie("token")
    }
  });
};

export const eventWrapper = handler => {
  return data => {
    if (data && data.eventData) {
      console.log("addEvent");
      store.commit("addEvent", data.eventData);
    }
    return handler(data);
  };
};

export const authBeforeEnter = (to, from, next) => {
  let token = getCookie("token");
  if (!token) {
    next("/login");
    return;
  }
  next();
};

export function enableNotifs() {
  notifyMe({ from: "notifications", message: "enabled" });
  setCookie("notifPref", "true", 1000000);
  store.state.enableVisualNotif = true;
}

/**
 * @todo move to state
 */
export function enableSound() {
  setCookie("soundNotifPref", "true", 1000000);
  store.state.enableSoundNotif = true;
}

export function disableNotifs() {
  setCookie("notifPref", "false", 1000000);
  store.state.enableVisualNotif = false;
}

export function disableSound() {
  setCookie("soundNotifPref", "false", 1000000);
  store.state.enableSoundNotif = false;
}

export const notifyMe = data => {
  try {
    let text = data.from + ": " + data.message;
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
      // If it's okay let's create a notification
      var notification = new Notification(text);
    }

    // Otherwise, we need to ask the user for permission
    /**
     *  Update: this is more or less no longer accepted by browsers
     * because the users needs to initiate the permission request
     */
    else if (Notification.permission !== "denied") {
      // Potentially do something in the app to show we cant give them notifs
      // Notification.requestPermission()
      //   .then(function(permission) {
      //     // If the user accepts, let's create a notification
      //     if (permission === "granted") {
      //       var notification = new Notification(text);
      //     }
      //   })
      //   .catch(err => {});
    }

    // At last, if the user has denied notifications, and you
    // want to be respectful there is no need to bother them any more.
  } catch (error) {
    console.log(error);
  }
};

async function requestPermission() {
  if (Notification.permission === "granted") {
    return true;
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== "denied") {
    return Notification.requestPermission().then(function(permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        return true;
      }
      return false;
    });
  } else {
    return false;
  }
}

export class FocusGrabber {
  isLive: Boolean;
  originalIndex: (string | null)[];
  elements: HTMLElement[];
  focusListener: () => void;
  constructor(elArr: HTMLElement[], tabIndexMultiplier = 40) {
    this.isLive = true;
    this.originalIndex = [];
    this.elements = elArr;
    elArr.forEach((el, index) => {
      this.focusListener = function() {
        document.addEventListener("keydown", function reset(e) {
          if (e.keyCode === 9) {
            e.preventDefault();
            elArr[0].focus();
            document.removeEventListener("keydown", reset);
          }
        });
      };
      this.originalIndex.push(el.getAttribute("tabindex"));
      el.setAttribute("tabindex", `${index + tabIndexMultiplier}`);
      if (index === elArr.length - 1) {
        el.addEventListener("focus", this.focusListener);
      }
    });
  }

  remove() {
    this.elements.forEach((el, index) => {
      if (this.originalIndex[index] !== null) {
        el.setAttribute("tabindex", this.originalIndex[index]);
      } else {
        el.removeAttribute("tabindex");
      }
      if (index === this.elements.length - 1) {
        el.removeEventListener("focus", this.focusListener);
      }
    });
  }
}

export const scrollBottom = function scrollBottom({ force, test }) {
  let newMessage: HTMLElement = this.$refs.messageScroll.querySelector(
    ".date__group:last-of-type li:last-of-type"
  );
  let doScroll = !!force;
  if (newMessage) {
    let clientHeight = this.$refs.messageScroll.clientHeight;
    let scrollTop = this.$refs.messageScroll.scrollTop;
    let scrollHeight = this.$refs.messageScroll.scrollHeight;

    let newMessageHeight = newMessage.clientHeight;
    let lastMessage = this.$refs.messageScroll.querySelector(
      ".date__group:last-of-type li:nth-last-of-type(2)"
    );

    let lastMessageHeight = lastMessage ? lastMessage.clientHeight : 0;
    doScroll = !doScroll
      ? clientHeight + scrollTop + newMessageHeight + lastMessageHeight >=
        scrollHeight
      : doScroll;
    if (doScroll) {
      newMessage.scrollIntoView({
        block: "start",
        behavior: "smooth"
      });
    }
  }

  // this.$refs.messageScroll.scrollTop = scrollHeight;
  // console.log(clientHeight, scrollHeight, scrollTop);
};

/** @todo eventually refactor and let this replace the old one */
export const scrollBottom2 = function scrollBottom({ element, force, test }) {
  let newMessage: HTMLElement = element.querySelector(
    ".date__group:last-of-type li:last-of-type"
  );
  let doScroll = !!force;
  if (newMessage) {
    let clientHeight = element.clientHeight;
    let scrollTop = element.scrollTop;
    let scrollHeight = element.scrollHeight;

    let newMessageHeight = newMessage.clientHeight;
    let lastMessage = element.querySelector(
      ".date__group:last-of-type li:nth-last-of-type(2)"
    );

    let lastMessageHeight = lastMessage ? lastMessage.clientHeight : 0;
    doScroll = !doScroll
      ? clientHeight + scrollTop + newMessageHeight + lastMessageHeight >=
        scrollHeight
      : doScroll;
    if (doScroll && !test) {
      element.scrollTo({
        top: scrollHeight + newMessageHeight + newMessageHeight,
        behavior: "smooth"
      });

      return scrollHeight + newMessageHeight + newMessageHeight;
    } else if (test) {
      return doScroll;
    }
  }
};

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
