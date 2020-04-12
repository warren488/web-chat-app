import axios from "axios";
import { AuthResponse, getFriendsResponse } from "./interfaces";

export const login = async (userData: Object): Promise<AuthResponse> => {
  return await axios({
    method: "POST",
    url: "http://localhost:3001/api/login",
    data: userData
  });
};

export function getCookie(name: String): String | null {
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
    url: "http://localhost:3001/api/users/me/friends"
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

export const getMessages = async (
  friendship_id: string,
  limit: number = 50
) => {
  return await axios({
    method: "GET",
    url: `http://localhost:3001/api/users/me/${friendship_id}/messages?limit=${limit}`,
    headers: {
      "Content-type": "application/json",
      "x-auth": getCookie("token")
    }
  }).then(({ data }) => {
    let orderedData = [];
    for (let i = data.length - 1; i >= 0; i--) {
      orderedData.push(data[i]);
    }
    return { data: orderedData };
  });
};

export const getMessagePage = async (
  friendship_id: string,
  limit: number = 50,
  timestamp
) => {
  return await axios({
    method: "GET",
    url: `http://localhost:3001/api/users/me/${friendship_id}/messagespage?limit=${limit}&timestamp=${timestamp}`,
    headers: {
      "Content-type": "application/json",
      "x-auth": getCookie("token")
    }
  }).then(({ data }) => {
    let orderedData = [];
    for (let i = data.length - 1; i >= 0; i--) {
      orderedData.push(data[i]);
    }
    return { data: orderedData };
  });
};

export const getLastMessage = async (friendship_id: string) => {
  return await axios({
    method: "GET",
    url: `http://localhost:3001/api/users/me/${friendship_id}/lastmessage`,
    headers: {
      "Content-type": "application/json",
      "x-auth": getCookie("token")
    }
  });
};

export const notifyMe = data => {
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
    Notification.requestPermission().then(function(permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification(text);
      }
    });
  }

  // At last, if the user has denied notifications, and you
  // want to be respectful there is no need to bother them any more.
};

export const scrollBottom = function scrollBottom({ force, test }) {
  let newMessage: HTMLElement = this.$refs.messageScroll.querySelector(
    "ol li:last-child"
  );
  let doScroll = !!force;
  console.log(force);
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
