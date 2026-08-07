import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  mastersApi,
  type BusMaster,
  type BusMasterWrite,
  type DisplayMaster,
  type RoleMaster,
  type RouteMaster,
  type UserMaster,
  type UserMasterWrite,
} from "../api/masters.api";
import { ApiError, NetworkError, type PagedQuery } from "../api/types";
import type { RootState } from ".";

/**
 * Master data lists. Paging and search belong to the server (§3.3), so the
 * screen sends a query and renders what comes back — it never filters a full
 * list locally, because it never has the full list.
 */
type Page<T> = { items: T[]; total: number; page: number; loading: boolean };

const emptyPage = <T,>(): Page<T> => ({ items: [], total: 0, page: 1, loading: false });

type MastersState = {
  buses: Page<BusMaster>;
  users: Page<UserMaster>;
  /** Small lookup lists, loaded whole — they are picker options, not pages. */
  routes: RouteMaster[];
  roles: RoleMaster[];
  displays: DisplayMaster[];
  /** Server's own wording for the last failed write. */
  error: string | null;
  saving: boolean;
};

const initialState: MastersState = {
  buses: emptyPage(),
  users: emptyPage(),
  routes: [],
  roles: [],
  displays: [],
  error: null,
  saving: false,
};

const messageFor = (error: unknown): string => {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  return "Something went wrong. Please try again.";
};

export const fetchBuses = createAsyncThunk<
  { items: BusMaster[]; total: number; page: number },
  PagedQuery | undefined,
  { rejectValue: string }
>("masters/buses", async (query, { rejectWithValue }) => {
  try {
    const r = await mastersApi.buses.list(query ?? {});
    return { items: r.Items, total: r.TotalRecords, page: r.PageNumber };
  } catch (error) {
    return rejectWithValue(messageFor(error));
  }
});

export const fetchUsers = createAsyncThunk<
  { items: UserMaster[]; total: number; page: number },
  PagedQuery | undefined,
  { rejectValue: string }
>("masters/users", async (query, { rejectWithValue }) => {
  try {
    const r = await mastersApi.users.list(query ?? {});
    return { items: r.Items, total: r.TotalRecords, page: r.PageNumber };
  } catch (error) {
    return rejectWithValue(messageFor(error));
  }
});

/** Picker options. Fetched once per visit, not per keystroke. */
export const fetchLookups = createAsyncThunk("masters/lookups", async () => {
  const [routes, roles] = await Promise.all([
    mastersApi.routes.list({ pageSize: 100 }),
    mastersApi.roles.list({ pageSize: 50 }),
  ]);
  return { routes: routes.Items, roles: roles.Items };
});

export const fetchDisplays = createAsyncThunk("masters/displays", async () => {
  const r = await mastersApi.displays.list({ pageSize: 50 });
  return r.Items;
});

export const saveBus = createAsyncThunk<
  void,
  { id?: number; body: BusMasterWrite },
  { rejectValue: string }
>("masters/saveBus", async ({ id, body }, { dispatch, rejectWithValue }) => {
  try {
    // Uniqueness is the server's answer, not ours — it owns the index.
    if (id) await mastersApi.buses.update(id, body);
    else await mastersApi.buses.create(body);
    await dispatch(fetchBuses());
  } catch (error) {
    return rejectWithValue(messageFor(error));
  }
});

export const removeBus = createAsyncThunk<void, number, { rejectValue: string }>(
  "masters/removeBus",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await mastersApi.buses.remove(id);
      await dispatch(fetchBuses());
    } catch (error) {
      return rejectWithValue(messageFor(error));
    }
  },
);

export const saveUser = createAsyncThunk<
  void,
  { id?: number; body: UserMasterWrite },
  { rejectValue: string }
>("masters/saveUser", async ({ id, body }, { dispatch, rejectWithValue }) => {
  try {
    if (id) await mastersApi.users.update(id, body);
    else await mastersApi.users.create(body);
    await dispatch(fetchUsers());
  } catch (error) {
    return rejectWithValue(messageFor(error));
  }
});

export const removeUser = createAsyncThunk<void, number, { rejectValue: string }>(
  "masters/removeUser",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await mastersApi.users.remove(id);
      await dispatch(fetchUsers());
    } catch (error) {
      return rejectWithValue(messageFor(error));
    }
  },
);

const mastersSlice = createSlice({
  name: "masters",
  initialState,
  reducers: {
    clearMastersError(s) {
      s.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuses.pending, (s) => {
        s.buses.loading = true;
      })
      .addCase(fetchBuses.fulfilled, (s, a) => {
        s.buses = { ...a.payload, loading: false };
      })
      .addCase(fetchBuses.rejected, (s, a) => {
        s.buses.loading = false;
        s.error = a.payload ?? "Could not load buses.";
      })
      .addCase(fetchUsers.pending, (s) => {
        s.users.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (s, a) => {
        s.users = { ...a.payload, loading: false };
      })
      .addCase(fetchUsers.rejected, (s, a) => {
        s.users.loading = false;
        s.error = a.payload ?? "Could not load users.";
      })
      .addCase(fetchLookups.fulfilled, (s, a) => {
        s.routes = a.payload.routes;
        s.roles = a.payload.roles;
      })
      .addCase(fetchDisplays.fulfilled, (s, a) => {
        s.displays = a.payload;
      })
      .addMatcher(
        (a) => /^masters\/(save|remove)/.test(a.type) && a.type.endsWith("/pending"),
        (s) => {
          s.saving = true;
          s.error = null;
        },
      )
      .addMatcher(
        (a) => /^masters\/(save|remove)/.test(a.type) && !a.type.endsWith("/pending"),
        (s, a: { type: string; payload?: unknown }) => {
          s.saving = false;
          if (a.type.endsWith("/rejected")) {
            s.error = typeof a.payload === "string" ? a.payload : "The change was refused.";
          }
        },
      );
  },
});

export const { clearMastersError } = mastersSlice.actions;
export default mastersSlice.reducer;

export const selectBusPage = (s: RootState) => s.masters.buses;
export const selectUserPage = (s: RootState) => s.masters.users;
export const selectRoutes = (s: RootState) => s.masters.routes;
export const selectRoles = (s: RootState) => s.masters.roles;
export const selectDisplays = (s: RootState) => s.masters.displays;
