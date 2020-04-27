export interface getFriendsResponse {
  data: Array<Object>;
}

export interface AuthResponse {
  data: { username: string; token: string };
}

export interface UserInfo {
  data: { username: string; email?: string };
}

export interface UpdatedUserInfo {
  data: { message: String; user: { username: string; email?: string } };
}

export interface RegisterResponse {
  data: {
    user: { id: string; email: string; username: string };
    token: string;
  };
}
