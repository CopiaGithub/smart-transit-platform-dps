import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { peopleApi, type Parent, type ParentChild } from "../api/people.api";
import { ApiError, NetworkError } from "../api/types";
import type { RootState } from ".";

/**
 * The signed-in parent and their children. Loaded once per visit — a child's
 * class and bus do not change during an afternoon. Where that bus *is* comes
 * from the live board, polled separately.
 */
type ParentState = {
  parent: Parent | null;
  children: ParentChild[];
  loading: boolean;
  /** True once we have asked, so "no children" reads differently from "not asked". */
  loaded: boolean;
  error: string | null;
};

const initialState: ParentState = {
  parent: null,
  children: [],
  loading: false,
  loaded: false,
  error: null,
};

const messageFor = (error: unknown): string => {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  return "Could not load your children right now.";
};

export const fetchMyChildren = createAsyncThunk<
  { parent: Parent | null; children: ParentChild[] },
  number,
  { rejectValue: string }
>("parent/mine", async (userId, { rejectWithValue }) => {
  try {
    const parent = await peopleApi.parentByUser(userId);
    const children = await peopleApi.children(parent.Id);
    return { parent, children };
  } catch (error) {
    // A staff account with no parent record answers 404 here, which is not an
    // error worth shouting about — the screen shows "no child linked".
    if (error instanceof ApiError && error.statusCode === 404) {
      return { parent: null, children: [] };
    }
    return rejectWithValue(messageFor(error));
  }
});

const parentSlice = createSlice({
  name: "parent",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyChildren.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchMyChildren.fulfilled, (s, a) => {
        s.loading = false;
        s.loaded = true;
        s.parent = a.payload.parent;
        s.children = a.payload.children;
      })
      .addCase(fetchMyChildren.rejected, (s, a) => {
        s.loading = false;
        s.loaded = true;
        s.error = a.payload ?? "Could not load your children right now.";
      });
  },
  reducers: {},
});

export default parentSlice.reducer;

export const selectMyChildren = (s: RootState) => s.parent.children;
