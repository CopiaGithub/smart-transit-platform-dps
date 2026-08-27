import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { STATUS } from "../../constants/domain";
import {
  operationsApi,
  type Board,
  type GateInRequest,
  type OperatorQueue,
  type PlatformStatus,
} from "../api/operations.api";
import { ApiError, NetworkError } from "../api/types";
import { closeSession, resetSession } from "./session.slice";
import type { RootState } from ".";

/**
 * Live bus movements. Every rule — which platform, when a waiting bus is
 * promoted, whether a bus may enter at all — belongs to the server. This slice
 * holds what it last told us and nothing more; it never computes a status.
 *
 * After every write the queue is re-fetched rather than patched locally: a
 * gate-out promotes a *different* bus into the freed platform (§5.5), so the
 * response for the bus we acted on is not the whole change.
 */
/**
 * Which `ops/` thunks are reads. Everything else under that prefix is a write and
 * drives `submitting`, which disables the gate buttons.
 *
 * Listed rather than sniffed out of the action name: this used to read "not queue
 * and not board", so the next read added would have silently locked every gate
 * button for the length of its own poll.
 */
const READ_THUNKS = ["ops/queue", "ops/board", "ops/platforms"];
const isRead = (type: string) => READ_THUNKS.some((prefix) => type.startsWith(prefix));

type OpsState = {
  queue: OperatorQueue | null;
  board: Board | null;
  /** The yard as a map — every platform, occupied or not. Admin screen only. */
  platforms: PlatformStatus | null;
  /** First load only — a poll must not blank the screen. */
  loading: boolean;
  /** True while a gate action is in flight; blocks double-taps. */
  submitting: boolean;
  error: string | null;
  /** Server's own confirmation of the last action, for the flash bar. */
  lastAction: string | null;
};

const initialState: OpsState = {
  queue: null,
  board: null,
  platforms: null,
  loading: false,
  submitting: false,
  error: null,
  lastAction: null,
};

const messageFor = (error: unknown): string => {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  return "Something went wrong. Please try again.";
};

/**
 * A read failure the screen has to act on differently depending on who refused.
 * `answered` = the server replied and said no (the session is closed, the role
 * may not look) — the data we are holding is gone and must not stay on screen.
 * A dropped poll answers nothing, so the last good list stays put.
 */
type ReadFailure = { message: string; answered: boolean };

const failure = (error: unknown): ReadFailure => ({
  message: messageFor(error),
  answered: error instanceof ApiError,
});

export const fetchQueue = createAsyncThunk<OperatorQueue, void, { rejectValue: ReadFailure }>(
  "ops/queue",
  async (_, { rejectWithValue }) => {
    try {
      return await operationsApi.getQueue();
    } catch (error) {
      return rejectWithValue(failure(error));
    }
  },
);

export const fetchBoard = createAsyncThunk<Board, string | undefined, { rejectValue: ReadFailure }>(
  "ops/board",
  async (displayCode, { rejectWithValue }) => {
    try {
      return await operationsApi.getBoard(displayCode);
    } catch (error) {
      return rejectWithValue(failure(error));
    }
  },
);

/**
 * The yard as a map. Every active platform, whether or not a bus is on it.
 *
 * A separate read from the queue on purpose: the queue answers "what can I do
 * next", this answers "where is everything", and only the admin's yard map asks
 * the second question.
 */
export const fetchPlatformStatus = createAsyncThunk<
  PlatformStatus,
  void,
  { rejectValue: ReadFailure }
>("ops/platforms", async (_, { rejectWithValue }) => {
  try {
    return await operationsApi.getPlatformStatus();
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});

/** Every write ends the same way: tell the user, then re-read the truth. */
function gateAction<Arg>(
  name: string,
  run: (arg: Arg) => Promise<string>,
) {
  return createAsyncThunk<string, Arg, { rejectValue: string }>(
    `ops/${name}`,
    async (arg, { dispatch, rejectWithValue }) => {
      try {
        const message = await run(arg);
        await dispatch(fetchQueue());
        return message;
      } catch (error) {
        // Refresh anyway: the refusal may be because somebody else already
        // moved this bus, and the stale list is what caused the mistake.
        dispatch(fetchQueue());
        return rejectWithValue(messageFor(error));
      }
    },
  );
}

export const gateIn = gateAction<GateInRequest & { busNumber: string }>(
  "gateIn",
  async ({ busNumber, ...body }) => {
    const row = await operationsApi.gateIn(body);
    // A full yard is a normal outcome, not a failure — say which it was.
    return row?.PlatformNumber != null
      ? `Bus ${busNumber} in · platform ${String(row.PlatformNumber).padStart(2, "0")}`
      : `Bus ${busNumber} in · waiting for a platform`;
  },
);

export const startBoarding = gateAction<{ eventId: number; busNumber: string }>(
  "boarding",
  async ({ eventId, busNumber }) => {
    await operationsApi.startBoarding(eventId);
    return `Bus ${busNumber} boarding`;
  },
);

export const gateOut = gateAction<{ busId: number; busNumber: string }>(
  "gateOut",
  async ({ busId, busNumber }) => {
    await operationsApi.gateOut(busId);
    return `Bus ${busNumber} departed`;
  },
);

export const replaceBus = gateAction<{
  eventId: number;
  reserveBusId: number;
  reserveBusNumber: string;
  reason?: string;
}>("replace", async ({ eventId, reserveBusId, reserveBusNumber, reason }) => {
  await operationsApi.replace(eventId, reserveBusId, reason);
  return `Bus ${reserveBusNumber} took over the run`;
});

/**
 * Replace addressed by the failed bus rather than its event — used when the bus
 * broke down before entering, so it has no event to name. The backend falls back
 * to the event path automatically if the bus is already in the yard.
 */
export const replaceByBus = gateAction<{
  failedBusId: number;
  reserveBusId: number;
  reserveBusNumber: string;
  reason?: string;
}>("replaceByBus", async ({ failedBusId, reserveBusId, reserveBusNumber, reason }) => {
  await operationsApi.replaceByBus(failedBusId, reserveBusId, reason);
  return `Bus ${reserveBusNumber} took over the run`;
});

export const undoLast = gateAction<void>("undo", async () => {
  await operationsApi.undoLast();
  return "Last entry undone";
});

const opsSlice = createSlice({
  name: "ops",
  initialState,
  reducers: {
    clearOpsFeedback(s) {
      s.error = null;
      s.lastAction = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQueue.pending, (s) => {
        // Only the first load shows a spinner; a poll must not flicker.
        if (!s.queue) s.loading = true;
      })
      .addCase(fetchQueue.fulfilled, (s, a) => {
        s.loading = false;
        s.queue = a.payload;
      })
      .addCase(fetchQueue.rejected, (s, a) => {
        s.loading = false;
        // Keep the last good queue on screen — a dropped poll is not a reason
        // to empty a gate operator's list mid-dispersal. A refusal is: the
        // session has ended (or was ended on another device) and holding the
        // old rows would show buses that are no longer anybody's to move.
        if (a.payload?.answered) s.queue = null;
        s.error = a.payload?.message ?? "Could not read the queue.";
      })
      .addCase(fetchBoard.fulfilled, (s, a) => {
        s.board = a.payload;
      })
      .addCase(fetchBoard.rejected, (s, a) => {
        if (a.payload?.answered) s.board = null;
        s.error = a.payload?.message ?? "Could not read the board.";
      })
      .addCase(fetchPlatformStatus.fulfilled, (s, a) => {
        s.platforms = a.payload;
      })
      .addCase(fetchPlatformStatus.rejected, (s, a) => {
        // Same rule as the board: a refusal means the session is gone and the
        // map must not keep showing buses nobody owns. A dropped poll keeps it.
        if (a.payload?.answered) s.platforms = null;
        s.error = a.payload?.message ?? "Could not read the yard.";
      })
      // Ending the day empties the yard by definition. Without this the tiles
      // and the board table keep yesterday's numbers until the next poll tick.
      .addMatcher(
        (a) => a.type === closeSession.fulfilled.type || a.type === resetSession.fulfilled.type,
        (s) => {
          s.queue = null;
          s.board = null;
          s.platforms = null;
          s.error = null;
          s.lastAction = null;
        },
      )
      .addMatcher(
        (a) => a.type.startsWith("ops/") && a.type.endsWith("/pending"),
        (s, a: { type: string }) => {
          if (isRead(a.type)) return;
          s.submitting = true;
          s.error = null;
        },
      )
      .addMatcher(
        (a) => a.type.startsWith("ops/") && a.type.endsWith("/fulfilled"),
        (s, a: { type: string; payload: unknown }) => {
          if (isRead(a.type)) return;
          s.submitting = false;
          s.lastAction = typeof a.payload === "string" ? a.payload : null;
        },
      )
      .addMatcher(
        (a) => a.type.startsWith("ops/") && a.type.endsWith("/rejected"),
        (s, a: { type: string; payload?: unknown }) => {
          if (isRead(a.type)) return;
          s.submitting = false;
          s.error = typeof a.payload === "string" ? a.payload : "The action was refused.";
        },
      );
  },
});

export const { clearOpsFeedback } = opsSlice.actions;
export default opsSlice.reducer;

// ── selectors ──────────────────────────────────────────────────────────────
const empty: never[] = [];

export const selectQueue = (s: RootState) => s.ops.queue;
export const selectPlatformStatus = (s: RootState) => s.ops.platforms;
export const selectBoardRows = (s: RootState) => s.ops.board?.Rows ?? empty;

/** Holding a platform — Arrived or Boarding. Server order, untouched. */
export const selectYard = (s: RootState) => s.ops.queue?.Yard ?? empty;
/** Inside with no platform, because every platform is occupied (§2.2). */
export const selectWaiting = (s: RootState) => s.ops.queue?.Waiting ?? empty;
export const selectAvailableBuses = (s: RootState) => s.ops.queue?.AvailableBuses ?? empty;
export const selectAvailableReserves = (s: RootState) => s.ops.queue?.AvailableReserves ?? empty;
export const selectUndoableEventId = (s: RootState) => s.ops.queue?.UndoableEventId ?? null;

/**
 * Ready to leave first — those are the only ones the exit gate may release.
 *
 * The comparator only separates boarding from the rest. Array.sort is stable,
 * so everything else keeps the server's order, which is already status rank
 * then platform number (§5.9). `QueueOrder` is the order buses *entered*, not
 * the order to display them — sorting by it scrambles the board.
 */
export const selectReadyToLeave = (s: RootState) => {
  const yard = s.ops.queue?.Yard ?? empty;
  const rank = (status: string) => (status === STATUS.boarding ? 0 : 1);
  return [...yard].sort((a, z) => rank(a.Status) - rank(z.Status));
};

/**
 * Everything recorded in through the entry gate this session, newest first.
 *
 * Yard and Waiting are one list to a guard checking their own work — whether a
 * platform happened to be free is the server's business, not a reason to file
 * the bus somewhere else. `QueueOrder` is the order they entered, so reversing
 * it puts the last bus recorded on top: the one most likely to be a mistake,
 * and the only one `undo-last` can still take back.
 */
export const selectRecordedIn = (s: RootState) => {
  const q = s.ops.queue;
  if (!q) return empty;
  return [...q.Yard, ...q.Waiting].sort((a, z) => z.QueueOrder - a.QueueOrder);
};

// Memoised: it builds a fresh object, so an unmemoised version made the board and
// dashboard re-render on every 5 s poll even when nothing it reads had changed.
export const selectOpsStats = createSelector(
  [(s: RootState) => s.ops.queue, (s: RootState) => s.ops.board?.Rows ?? empty],
  (q, rows) => {
    return {
    onCampus: q?.OccupiedCount ?? 0,
    platformCount: q?.PlatformCount ?? 0,
    nextPlatform: q?.NextFreePlatformNumber ?? null,
    yardFull: q?.YardFull ?? false,
    waiting: q?.Waiting.length ?? 0,
    awaited: q?.AvailableBuses.length ?? 0,
    reserves: q?.AvailableReserves.length ?? 0,
    // Expected today but not yet through the gate — synthesised onto the board.
    yetToArrive: rows.filter((r) => r.Status === STATUS.yetToArrive).length,
    arrived: rows.filter((r) => r.Status === STATUS.arrived).length,
    boarding: rows.filter((r) => r.Status === STATUS.boarding).length,
    departed: rows.filter((r) => r.Status === STATUS.departed).length,
    // The fifth state, and the reason the dashboard's numbers used to look
    // wrong: a replaced bus is still one of the day's events, so the server
    // counts it in the session total while no tile accounted for it.
      replaced: rows.filter((r) => r.Status === STATUS.replaced).length,
    };
  },
);
