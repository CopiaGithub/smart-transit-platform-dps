import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type AxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import { ApiError, NetworkError, type ApiEnvelope } from "../api/types";

export const TOKEN_KEY = "auth.token";

/** Set once by the store so a dead session can sign the app out from here. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/**
 * In dev, take the API host from wherever Metro is being served — but only when
 * the configured API is a local one.
 *
 * Metro's address is by definition reachable from this device — it is how the
 * bundle arrived — so borrowing it makes `localhost` work on an emulator, on a
 * physical phone, and after the laptop's Wi-Fi address changes, with nothing to
 * edit. Only the host is borrowed; the port and path stay as configured.
 *
 * A hosted API is a different case entirely: it is already reachable from
 * anywhere, and pointing it at Metro's LAN IP would aim the app at a machine
 * that is not serving the API at all. So the swap is limited to loopback hosts
 * — otherwise setting `dev.apiUrl` to the real server silently breaks it.
 *
 * qa and production always use their configured URL.
 */
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];

function resolveBaseUrl(): string {
  const configured = (Constants.expoConfig?.extra?.apiUrl as string) ?? "";
  if (Constants.expoConfig?.extra?.appEnv !== "dev") return configured;

  try {
    const url = new URL(configured);
    if (!LOCAL_HOSTS.includes(url.hostname)) return configured;

    // hostUri looks like "192.168.1.5:8081".
    const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
    if (!metroHost) return configured;

    url.hostname = metroHost;
    return url.toString();
  } catch {
    return configured;
  }
}

const axiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(async (config) => {
  // The LED board endpoint is served without a login (an unattended screen has
  // no user), so callers can opt out of the header entirely.
  if (config.headers?.["X-Skip-Auth"]) {
    delete config.headers["X-Skip-Auth"];
    return config;
  }
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Wording for the statuses that arrive without the server's own message. */
function defaultMessage(status: number): string {
  switch (status) {
    case 401:
      return "Your session has ended. Please sign in again.";
    case 403:
      // §7.1: entry staff cannot record departures and vice versa.
      return "Your role is not allowed to do this. Use the correct post's account.";
    case 404:
      return "That record no longer exists.";
    default:
      return status >= 500
        ? "The server had a problem. Please try again."
        : "The server rejected the request.";
  }
}

/**
 * Unwraps the API envelope.
 *
 * This API answers HTTP 200 to everything that reaches a controller — success,
 * validation failure and an expired session alike — and puts the real outcome
 * in the body. So the branch is on `Success`, never on `response.status`.
 * Getting this wrong makes every error look like a success carrying `null`.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One retry, for reads that got no reply at all.
 *
 * Deliberately GET only. When a write times out we cannot tell whether the
 * server processed it and the *answer* was lost — re-sending would risk
 * recording the same bus through the gate twice. A guard who sees an error and
 * taps again is making that choice knowingly; the app must not make it for
 * them. Reads carry no such risk, and a gate phone on school Wi-Fi drops
 * packets often enough that one silent retry saves a lot of false alarms.
 */
async function send<T>(config: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
  try {
    return (await axiosInstance.request<ApiEnvelope<T>>(config)).data;
  } catch (error) {
    const gotAReply = axios.isAxiosError(error) && !!error.response;
    const isRead = (config.method ?? "GET").toUpperCase() === "GET";
    if (gotAReply || !isRead) throw error;

    await sleep(600);
    return (await axiosInstance.request<ApiEnvelope<T>>(config)).data;
  }
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  let envelope: ApiEnvelope<T>;

  try {
    envelope = await send<T>(config);
  } catch (error) {
    // A reply with a non-200 status. Rare, because the wrapper forces 200 on
    // anything that reaches a controller — but [Authorize] rejects *before*
    // the filter runs, so a wrong-role call arrives as a bare 403 with no
    // body at all. Treating that as a network failure would tell a guard the
    // server is unreachable when they simply lack the permission.
    if (axios.isAxiosError(error) && error.response) {
      const body = error.response.data as Partial<ApiEnvelope<T>> | undefined;
      const statusCode = body?.StatusCode ?? error.response.status;
      const failure = new ApiError(body?.ErrorMessage ?? defaultMessage(statusCode), statusCode);
      if (failure.isSessionExpired) onUnauthorized?.();
      throw failure;
    }
    // Genuinely no reply: timeout, DNS, connection refused.
    throw new NetworkError();
  }

  // A body that is not an envelope means the contract changed under us.
  if (!envelope || typeof envelope.Success !== "boolean") {
    throw new ApiError("Unexpected response from the server.", 500);
  }

  if (!envelope.Success) {
    const failure = new ApiError(
      envelope.ErrorMessage ?? "The request could not be completed.",
      envelope.StatusCode ?? 400,
    );
    if (failure.isSessionExpired) onUnauthorized?.();
    throw failure;
  }

  return envelope.Result as T;
}

/** Drops undefined keys so optional query params never become "?x=undefined". */
const clean = (params?: Record<string, unknown>) =>
  params && Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "GET", url, params: clean(params) }),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "POST", url, data }),

  patch: <T>(url: string, data?: unknown) => request<T>({ method: "PATCH", url, data }),

  delete: <T>(url: string) => request<T>({ method: "DELETE", url }),

  /** For the public LED board, which must work without a signed-in user. */
  getPublic: <T>(url: string, params?: Record<string, unknown>) =>
    request<T>({
      method: "GET",
      url,
      params: clean(params),
      headers: { "X-Skip-Auth": "1" },
    }),
};

export default axiosInstance;
