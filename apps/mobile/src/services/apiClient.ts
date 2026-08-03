import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { resetTo } from "./navigationRef";

export const TOKEN_KEY = "auth.token";

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
    // 401 anywhere => the session is gone; drop the token and bounce to Login.
    if (error?.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      resetTo("Login");
    }
    return Promise.reject(error);
  },
);

export default apiClient;
