import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { sessionApi, type DispersalSession, type OpenSessionRequest } from "../api/session.api";
import { ApiError, NetworkError } from "../api/types";
import type { RootState } from ".";

/**
 * One afternoon's dispersal. Nothing can be recorded until a session is open
 * and only one may be open at a time across the school (§5.2) — which is what
 * stops two operators working on different days' records.
 */
type SessionState = {
  current: DispersalSession | null;
  /** False until the first fetch lands, so screens can tell "none" from "not asked". */
  loaded: boolean;
  loading: boolean;
  /** Set by open/close/reset failures; the server's own wording. */
  error: string | null;
};

const initialState: SessionState = {
  current: null,
  loaded: false,
  loading: false,
  error: null,
};

const messageFor = (error: unknown): string => {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  return "Something went wrong. Please try again.";
};

export const fetchCurrentSession = createAsyncThunk<
  DispersalSession | null,
  void,
  { rejectValue: string }
>("session/current", async (_, { rejectWithValue }) => {
  try {
    return await sessionApi.getCurrent();
  } catch (error) {
    return rejectWithValue(messageFor(error));
  }
});

export const openSession = createAsyncThunk<
  DispersalSession,
  OpenSessionRequest | undefined,
  { rejectValue: string }
>("session/open", async (body, { rejectWithValue }) => {
  try {
    return await sessionApi.open(body ?? {});
  } catch (error) {
    return rejectWithValue(messageFor(error));
  }
});

export const closeSession = createAsyncThunk<
  DispersalSession,
  number,
  { rejectValue: string }
>("session/close", async (id, { rejectWithValue }) => {
  try {
    return await sessionApi.close(id);
  } catch (error) {
    // Usually correct: a bus really was never marked out. The server names
    // which ones, so pass its message straight through.
    return rejectWithValue(messageFor(error));
  }
});

export const resetSession = createAsyncThunk<
  DispersalSession,
  number,
  { rejectValue: string }
>("session/reset", async (id, { rejectWithValue }) => {
  try {
    return await sessionApi.reset(id);
  } catch (error) {
    return rejectWithValue(messageFor(error));
  }
});

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    clearSessionError(s) {
      s.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentSession.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchCurrentSession.fulfilled, (s, a) => {
        s.loading = false;
        s.loaded = true;
        s.current = a.payload;
        s.error = null;
      })
      .addCase(fetchCurrentSession.rejected, (s, a) => {
        s.loading = false;
        // Still "loaded": we asked and got an answer, even if it was a failure.
        // Otherwise a dead network leaves every screen on a spinner forever.
        s.loaded = true;
        s.error = a.payload ?? "Could not read the dispersal session.";
      })
      .addCase(openSession.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(openSession.fulfilled, (s, a) => {
        s.loading = false;
        s.loaded = true;
        s.current = a.payload;
      })
      .addCase(openSession.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload ?? "Could not open the session.";
      })
      // Close and reset both end the session, so both clear it.
      .addCase(closeSession.fulfilled, (s) => {
        s.current = null;
        s.error = null;
      })
      .addCase(closeSession.rejected, (s, a) => {
        s.error = a.payload ?? "Could not close the session.";
      })
      .addCase(resetSession.fulfilled, (s) => {
        s.current = null;
        s.error = null;
      })
      .addCase(resetSession.rejected, (s, a) => {
        s.error = a.payload ?? "Could not reset the session.";
      });
  },
});

export const { clearSessionError } = sessionSlice.actions;
export default sessionSlice.reducer;

// ── selectors ──────────────────────────────────────────────────────────────
export const selectSession = (s: RootState) => s.session.current;
export const selectSessionId = (s: RootState) => s.session.current?.Id ?? null;
export const selectHasOpenSession = (s: RootState) => s.session.current !== null;
