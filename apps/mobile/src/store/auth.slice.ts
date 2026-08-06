import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Role } from "../../constants/domain";
import type { RootState } from ".";

/** Security guards carry the gate they are posted at; nobody else needs one. */
export type User = {
  id: string;
  name: string;
  role: Role;
  gateId: string | null;
};

export const TOKEN_KEY = "auth.token";
const SESSION_KEY = "session.user";

type AuthState = {
  token: string | null;
  user: User | null;
  /** False until the stored session has been read — the app shows Splash. */
  booted: boolean;
  status: "idle" | "loading" | "failed";
  error: string | null;
};

const initialState: AuthState = {
  token: null,
  user: null,
  booted: false,
  status: "idle",
  error: null,
};

// Read once at startup. The role/gate has to come back with the token,
// otherwise a restored guard lands on the wrong screen.
export const restoreSession = createAsyncThunk("auth/restore", async () => {
  const [token, raw] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(SESSION_KEY),
  ]);
  if (!token || !raw) return null;
  return { token, user: JSON.parse(raw) as User };
});

export const login = createAsyncThunk<
  { token: string; user: User },
  /** `identifier` is whichever the person finds easier — username or mobile. */
  { identifier: string; password: string },
  { state: RootState; rejectValue: string }
>("auth/login", async (creds, { getState, rejectWithValue }) => {
  // ponytail: resolved against the local user master until the backend
  // contract exists. Swap the lookup for `apiClient.post("auth/login", creds)`
  // — the response shape (role + gateId on the user) is already what we use.
  const id = creds.identifier.trim().toLowerCase();
  const found = getState().ops.users.find(
    (u) => u.username.toLowerCase() === id || u.mobile === id,
  );
  if (!found) {
    return rejectWithValue("No user with that username or mobile number");
  }

  const token = `demo-${found.id}`;
  const user: User = {
    id: found.id,
    name: found.name,
    role: found.role,
    gateId: found.gateId,
  };
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [SESSION_KEY, JSON.stringify(user)],
  ]);
  return { token, user };
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, SESSION_KEY]);
});

/** Signing out must strip the session even if storage misbehaves — leaving a
 *  guard signed in because a disk write failed is the worse outcome. */
const clearSession = (s: AuthState) => {
  s.token = null;
  s.user = null;
  s.status = "idle";
  s.error = null;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (s, a) => {
        s.token = a.payload?.token ?? null;
        s.user = a.payload?.user ?? null;
        s.booted = true;
      })
      // Corrupt storage must not strand the app on the splash screen.
      .addCase(restoreSession.rejected, (s) => {
        clearSession(s);
        s.booted = true;
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
        s.error = a.payload ?? a.error.message ?? "Login failed";
      })
      .addCase(logout.fulfilled, clearSession)
      .addCase(logout.rejected, clearSession);
  },
});

export default authSlice.reducer;
