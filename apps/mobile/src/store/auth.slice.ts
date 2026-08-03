import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { TOKEN_KEY } from "../services/apiClient";

type User = { id: string; name: string; role: string };

type AuthState = {
  token: string | null;
  user: User | null;
  status: "idle" | "loading" | "failed";
  error: string | null;
};

const initialState: AuthState = {
  token: null,
  user: null,
  status: "idle",
  error: null,
};

// Called by Splash — decides Login vs Main.
export const restoreSession = createAsyncThunk("auth/restore", async () => {
  return AsyncStorage.getItem(TOKEN_KEY);
});

export const login = createAsyncThunk(
  "auth/login",
  async (creds: { username: string; password: string; role: string }) => {
    // ponytail: stubbed until the backend contract exists. Swap for
    // `apiClient.post("auth/login", creds)` and return response.data.
    const token = `demo-${creds.username}`;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return { token, user: { id: "1", name: creds.username, role: creds.role } };
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (s, a) => {
        s.token = a.payload;
      })
      .addCase(login.pending, (s) => {
        s.status = "loading";
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = "idle";
        s.token = a.payload.token;
        s.user = a.payload.user;
      })
      .addCase(login.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.error.message ?? "Login failed";
      })
      .addCase(logout.fulfilled, (s) => {
        s.token = null;
        s.user = null;
      });
  },
});

export default authSlice.reducer;
