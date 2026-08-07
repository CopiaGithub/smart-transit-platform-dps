import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { STATUS } from "../../constants/domain";
import {
  operationsApi,
  type Board,
  type GateInRequest,
  type OperatorQueue,
} from "../api/operations.api";
import { ApiError, NetworkError } from "../api/types";
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
type OpsState = {
  queue: OperatorQueue | null;
  board: Board | null;
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
  loading: false,
  submitting: false,
  error: null,
  lastAction: null,
};

const messageFor = (error: unknown): string => {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  return "Something went wrong. Please try again.";
};

export const fetchQueue = createAsyncThunk<OperatorQueue, void, { rejectValue: string }>(
  "ops/queue",
  async (_, { rejectWithValue }) => {
    try {
      return await operationsApi.getQueue();
    } catch (error) {
      return rejectWithValue(messageFor(error));
    }
  },
);

export const fetchBoard = createAsyncThunk<Board, string | undefined, { rejectValue: string }>(
  "ops/board",
  async (displayCode, { rejectWithValue }) => {
    try {
      return await operationsApi.getBoard(displayCode);
    } catch (error) {
      return rejectWithValue(messageFor(error));
    }
  },
);

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
        // to empty a gate operator's list mid-dispersal.
        s.error = a.payload ?? "Could not read the queue.";
      })
      .addCase(fetchBoard.fulfilled, (s, a) => {
        s.board = a.payload;
      })
      .addMatcher(
        (a) => a.type.startsWith("ops/") && a.type.endsWith("/pending"),
        (s, a: { type: string }) => {
          if (a.type.includes("queue") || a.type.includes("board")) return;
          s.submitting = true;
          s.error = null;
        },
      )
      .addMatcher(
        (a) => a.type.startsWith("ops/") && a.type.endsWith("/fulfilled"),
        (s, a: { type: string; payload: unknown }) => {
          if (a.type.includes("queue") || a.type.includes("board")) return;
          s.submitting = false;
          s.lastAction = typeof a.payload === "string" ? a.payload : null;
        },
      )
      .addMatcher(
        (a) => a.type.startsWith("ops/") && a.type.endsWith("/rejected"),
        (s, a: { type: string; payload?: unknown }) => {
          if (a.type.includes("queue") || a.type.includes("board")) return;
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

export const selectOpsStats = (s: RootState) => {
  const q = s.ops.queue;
  const rows = s.ops.board?.Rows ?? empty;
  return {
    onCampus: q?.OccupiedCount ?? 0,
    platformCount: q?.PlatformCount ?? 0,
    nextPlatform: q?.NextFreePlatformNumber ?? null,
    yardFull: q?.YardFull ?? false,
    waiting: q?.Waiting.length ?? 0,
    awaited: q?.AvailableBuses.length ?? 0,
    reserves: q?.AvailableReserves.length ?? 0,
    arrived: rows.filter((r) => r.Status === STATUS.arrived).length,
    boarding: rows.filter((r) => r.Status === STATUS.boarding).length,
    departed: rows.filter((r) => r.Status === STATUS.departed).length,
  };
};
