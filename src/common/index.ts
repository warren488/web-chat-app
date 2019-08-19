import axios from "axios";

export const login = async (userData: Object): Promise<Object> => {
  return await axios({
    method: "POST",
    url: "http://localhost:3001/api/login",
    data: userData
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
