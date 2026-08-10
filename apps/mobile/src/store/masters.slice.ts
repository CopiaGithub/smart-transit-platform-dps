import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  mastersApi,
  type BusMaster,
  type BusMasterWrite,
  type DisplayMaster,
  type GateMaster,
  type PlatformMaster,
  type PlatformMasterWrite,
  type RoleMaster,
  type RouteMaster,
  type RouteMasterWrite,
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
  /**
   * Loaded whole rather than paged. A school has a handful of routes and one
   * platform per painted bay — both are small, fixed lists, so a page number
   * and a debounced server search would be machinery for nothing. Buses and
   * users are paged because they genuinely grow.
   */
  routes: RouteMaster[];
  roles: RoleMaster[];
  displays: DisplayMaster[];
  platforms: PlatformMaster[];
  /**
   * Which posts exist. Read by every signed-in user, not just an admin — a
   * guard's own post is worked out from these, so the Gate screen cannot render
   * without them.
   */
  gates: GateMaster[];
  /**
   * True once the gates request has answered, succeeded or failed. The Gate
   * screen needs the difference: still loading is a blank frame, answered-with-
   * nothing is a guard who has to be told, not left staring.
   */
  gatesLoaded: boolean;
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
  platforms: [],
  gates: [],
  gatesLoaded: false,
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

/**
 * Picker options and the routes admin list. Fetched once per visit, not per keystroke.
 *
 * Routes come in two calls for the same reason platforms do: `isActive` filters
 * to that exact flag, so retired routes are invisible unless asked for
 * separately — and the routes screen has to be able to switch one back on.
 * Roles stay active-only; they are a picker here and nothing edits them.
 *
 * Consumers that need only live routes filter this list themselves — see
 * BusForm, which keeps a bus's own route on the list even after it retires.
 */
export const fetchLookups = createAsyncThunk("masters/lookups", async () => {
  const [routes, retiredRoutes, roles] = await Promise.all([
    mastersApi.routes.list({ pageSize: 100, isActive: true }),
    mastersApi.routes.list({ pageSize: 100, isActive: false }),
    mastersApi.roles.list({ pageSize: 50 }),
  ]);
  return { routes: [...routes.Items, ...retiredRoutes.Items], roles: roles.Items };
});

/**
 * The posts. Fetched once when the drawer mounts, because the Gate screen and
 * the Profile both need to name a guard's post and neither can work it out
 * alone. Failure is swallowed into `gates: []` rather than an error banner —
 * the menu is already correct without them (see toViewer), and a guard whose
 * post is merely unnamed can still pick one on screen.
 */
export const fetchGates = createAsyncThunk("masters/gates", async () => {
  const r = await mastersApi.gates.list({ pageSize: 50 });
  return r.Items;
});

export const fetchDisplays = createAsyncThunk("masters/displays", async () => {
  const r = await mastersApi.displays.list({ pageSize: 50 });
  return r.Items;
});

/**
 * Every platform, open and closed alike.
 *
 * Asked for in two calls because the server has no "both" option: `isActive`
 * filters to that exact flag (see PagedQuery), so one request can never return
 * the whole list. The admin screen has to show closed platforms — reopening one
 * is the entire reason it exists, and a list that hid them would be a trap.
 */
export const fetchPlatforms = createAsyncThunk<
  PlatformMaster[],
  void,
  { rejectValue: string }
>("masters/platforms", async (_, { rejectWithValue }) => {
  try {
    const [open, closed] = await Promise.all([
      mastersApi.platforms.list({ pageSize: 200, isActive: true }),
      mastersApi.platforms.list({ pageSize: 200, isActive: false }),
    ]);
    return [...open.Items, ...closed.Items];
  } catch (error) {
    return rejectWithValue(messageFor(error));
  }
});

export const savePlatform = createAsyncThunk<
  void,
  { id?: number; body: PlatformMasterWrite },
  { rejectValue: string }
>("masters/savePlatform", async ({ id, body }, { dispatch, rejectWithValue }) => {
  try {
    if (id) await mastersApi.platforms.update(id, body);
    else await mastersApi.platforms.create(body);
    await dispatch(fetchPlatforms());
  } catch (error) {
    return rejectWithValue(messageFor(error));
  }
});

export const removePlatform = createAsyncThunk<void, number, { rejectValue: string }>(
  "masters/removePlatform",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await mastersApi.platforms.remove(id);
      await dispatch(fetchPlatforms());
    } catch (error) {
      return rejectWithValue(messageFor(error));
    }
  },
);

export const saveRoute = createAsyncThunk<
  void,
  { id?: number; body: RouteMasterWrite },
  { rejectValue: string }
>("masters/saveRoute", async ({ id, body }, { dispatch, rejectWithValue }) => {
  try {
    if (id) await mastersApi.routes.update(id, body);
    else await mastersApi.routes.create(body);
    // Routes are also the bus form's picker options, so the one refresh serves both.
    await dispatch(fetchLookups());
  } catch (error) {
    return rejectWithValue(messageFor(error));
  }
});

export const removeRoute = createAsyncThunk<void, number, { rejectValue: string }>(
  "masters/removeRoute",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await mastersApi.routes.remove(id);
      await dispatch(fetchLookups());
    } catch (error) {
      return rejectWithValue(messageFor(error));
    }
  },
);

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
      .addCase(fetchGates.pending, (s) => {
        s.gatesLoaded = false;
      })
      .addCase(fetchGates.fulfilled, (s, a) => {
        s.gates = a.payload;
        s.gatesLoaded = true;
      })
      .addCase(fetchGates.rejected, (s) => {
        // Answered, with nothing. Not an error banner — the Gate screen says it
        // in place, where the person who is blocked by it is standing.
        s.gatesLoaded = true;
      })
      .addCase(fetchPlatforms.fulfilled, (s, a) => {
        s.platforms = a.payload;
      })
      .addCase(fetchPlatforms.rejected, (s, a) => {
        s.error = a.payload ?? "Could not load platforms.";
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
export const selectPlatforms = (s: RootState) => s.masters.platforms;
/** Raw GateMaster rows. Map with toGates for a picker; toViewer takes them as-is. */
export const selectGateRows = (s: RootState) => s.masters.gates;
export const selectGatesLoaded = (s: RootState) => s.masters.gatesLoaded;
