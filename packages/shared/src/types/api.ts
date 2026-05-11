export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};
