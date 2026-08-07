import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authApi } from "../api/auth.api";
import { ApiError, NetworkError } from "../api/types";
import { decodeToken, isExpired, type JwtClaims } from "../services/jwt";
import { TOKEN_KEY } from "../services/apiClient";

/**
 * Everything the app knows about the signed-in person comes from the token's
 * claims — the login endpoint returns no user object. `roleName` is the string
 * the server assigned; the menu maps it, nothing else interprets it.
 */
export type User = JwtClaims;

const EXPIRY_KEY = "auth.expiresAt";

type AuthState = {
  token: string | null;
  user: User | null;
  /** False until stored credentials have been read — the app shows Splash. */
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

/** Turns any thrown error into the sentence a user should read. */
const messageFor = (error: unknown): string => {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  return "Sign-in failed. Please try again.";
};

// Read once at startup. An expired token is discarded here rather than waiting
// for the first request to fail somewhere less convenient.
export const restoreSession = createAsyncThunk("auth/restore", async () => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const claims = decodeToken(token);

  if (!token || !claims || isExpired(claims)) {
    await AsyncStorage.multiRemove([TOKEN_KEY, EXPIRY_KEY]);
    return null;
  }
  return { token, user: claims };
});

export const login = createAsyncThunk<
  { token: string; user: User },
  { identifier: string; password: string },
  { rejectValue: string }
>("auth/login", async (creds, { rejectWithValue }) => {
  try {
    const result = await authApi.login({
      username: creds.identifier.trim(),
      password: creds.password,
    });

    const claims = decodeToken(result.Token);
    if (!claims) {
      return rejectWithValue("The server returned a token this app cannot read.");
    }

    await AsyncStorage.multiSet([
      [TOKEN_KEY, result.Token],
      [EXPIRY_KEY, result.TokenExpiresAt ?? ""],
    ]);
    return { token: result.Token, user: claims };
  } catch (error) {
    // The server's own wording — "Account is temporarily locked due to
    // repeated failed logins." is more useful than anything we could write.
    return rejectWithValue(messageFor(error));
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, EXPIRY_KEY]);
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
  reducers: {
    /** Called by the api client when the server rejects the session. */
    sessionExpired: clearSession,
  },
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
        s.error = a.payload ?? "Sign-in failed. Please try again.";
      })
      .addCase(logout.fulfilled, clearSession)
      .addCase(logout.rejected, clearSession);
  },
});

export const { sessionExpired } = authSlice.actions;
export default authSlice.reducer;
