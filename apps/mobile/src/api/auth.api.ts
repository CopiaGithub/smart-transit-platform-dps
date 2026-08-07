import { api } from "../services/apiClient";

/** Email, employee code or mobile number — the server ORs all three. */
export type LoginRequest = { username: string; password: string };

/**
 * No user object comes back. Identity is inside the token; decode it with
 * `src/services/jwt.ts`.
 */
export type LoginResponse = {
  Token: string;
  TokenExpiresAt: string;
};

export const authApi = {
  login: (body: LoginRequest) => api.post<LoginResponse>("Auth/login", body),
};
