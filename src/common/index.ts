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

export const getMessages = async (friendship_id: string) => {
  return await axios({
    method: "GET",
    url: `http://localhost:3001/api/users/me/${friendship_id}/messages`,
    headers: {
      "Content-type": "application/json",
      "x-auth": getCookie("token")
    }
  });
};
