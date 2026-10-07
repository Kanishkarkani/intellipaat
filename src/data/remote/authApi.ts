export interface LoginResponse {
  token: string;
}

export interface AuthApi {
  login(email: string, password: string): Promise<LoginResponse>;
}
