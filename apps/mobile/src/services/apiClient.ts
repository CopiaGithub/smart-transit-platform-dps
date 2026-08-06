import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { store } from "../store";
import { logout, TOKEN_KEY } from "../store/auth.slice";

const apiClient = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl as string,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    // 401 anywhere => the session is gone. Same exit as tapping Sign out, so
    // there is only one way out of the app and it always ends at Login.
    if (error?.response?.status === 401) store.dispatch(logout());
    return Promise.reject(error);
  },
);

export default apiClient;
