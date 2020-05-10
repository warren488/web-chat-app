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
import Vue from "vue";
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
// export const baseURI = "http://localhost:3001";

export const uploadToFireBase = file => {
  // Create a root reference
  var storageRef = firebase.storage().ref();

  // Create a reference to 'images/mountains.jpg'
  var ref = storageRef.child(`profileImages/.jpg${file.name}`);
  return ref.put(file).then(function(snapshot) {
    return snapshot.ref.getDownloadURL();
  });
};

export const eventBus = new Vue({
  methods: {
    dataLoaded() {
      this.$emit("loaded");
    }
  }
});

export function encodeBase64(file) {
  return new Promise((resolve, reject) => {
    var imgReader = new FileReader();
    imgReader.onloadend = function() {
      console.log("Base64 Format", resolve(imgReader.result));
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

export const checkusername = async (username): Promise<Boolean> => {
  return await axios({
    method: "GET",
    url: `${baseURI}/api/users/${username}?exists=true`
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
    url: `${baseURI}/api/users?username=${username}`
  });
};

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

export const getFriends = async (): Promise<getFriendsResponse> => {
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

export const addFriend = async (
  username: string
): Promise<getFriendsResponse> => {
  return await axios({
    method: "POST",
    headers: {
      "x-auth": getCookie("token")
    },
    data: { username },
    url: `${baseURI}/api/users/me/friends`
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
      friendship_id
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
    /** remember in messages the last message is the first item in the array */
    if (messages.length > 0) {
      let recPromise = markAsReceived(friendship_id, [
        messages[0].createdAt,
        messages[messages.length - 1].createdAt
      ]).catch(() => {
        console.log("failed to mark as received");
      });
    }
    let orderedMessages = [];
    let unreadIndex = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      let orderedIndex = orderedMessages.push(messages[i]) - 1;
      if (
        messages[i].status !== "received" &&
        messages[i].fromId === store.state.user.id
      ) {
        /**
         * we can choose to loop through this index for searching or create an index for this index
         * on the createdAt date
         */
        unreadIndex.push({ ...messages[i], orderedIndex });
      }
    }
    return { data: orderedMessages, unreadIndex };
  });
};

export const getMessagePage = async (
  friendship_id: string,
  limit: number = 50,
  timestamp
) => {
  return await axios({
    method: "GET",
    url: `${baseURI}/api/users/me/${friendship_id}/messagespage?limit=${limit}&timestamp=${timestamp}`,
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
    let orderedMessages = [];
    let unreadIndex = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      let orderedIndex = orderedMessages.push(messages[i]);
      if (messages[i].status !== "received") {
        /**
         * we can choose to loop through this index for searching or create an index for this index
         * on the createdAt date
         */
        unreadIndex.push({ ...messages[i], orderedIndex });
      }
    }
    return { data: orderedMessages, unreadIndex };
  });
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
    else if (Notification.permission !== "denied") {
      Notification.requestPermission()
        .then(function(permission) {
          // If the user accepts, let's create a notification
          if (permission === "granted") {
            var notification = new Notification(text);
          }
        })
        .catch(err => {});
    }

    // At last, if the user has denied notifications, and you
    // want to be respectful there is no need to bother them any more.
  } catch (error) {
    console.log(error);
  }
};

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
    "ol li:last-child"
  );
  let doScroll = !!force;
  if (newMessage) {
    let clientHeight = this.$refs.messageScroll.clientHeight;
    let scrollTop = this.$refs.messageScroll.scrollTop;
    let scrollHeight = this.$refs.messageScroll.scrollHeight;

    let newMessageHeight = newMessage.clientHeight;
    let lastMessage = this.$refs.messageScroll.querySelector(
      "ol li:nth-last-child(2)"
    );

    let lastMessageHeight = lastMessage ? lastMessage.clientHeight : 0;
    doScroll = !doScroll
      ? clientHeight + scrollTop + newMessageHeight + lastMessageHeight >=
        scrollHeight
      : doScroll;
    if (doScroll) {
      this.$refs.messageScroll.scrollTop =
        scrollHeight + newMessageHeight + newMessageHeight;
    }
  }

  // this.$refs.messageScroll.scrollTop = scrollHeight;
  // console.log(clientHeight, scrollHeight, scrollTop);
};

/** =================================================================== */
/**  ##     ##      ##     #  #     ####  #####
 *  #  #   #  #    #  #    # #      #       #
 *  #      #  #    #       ##       #       #
 *   ##    #  #    #       #        ####    #
 *     #   #  #    #       ##       #       #
 *  #  #   #  #    #  #    # #      #       #
 *   ##     ##      ##     #  #     ####    #
 */
