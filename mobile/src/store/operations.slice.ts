import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { STATUS, STATUS_RANK } from "../../constants/domain";
import { nextFreeSlot } from "../domain/allocation";
import { SEED_FLEET, SEED_USERS, type Bus } from "../data/seed";
import type { RootState } from ".";

type OpsState = {
  fleet: Bus[];
  users: typeof SEED_USERS;
  /** Supports a single-step undo of the last assignment, as the SOP requires. */
  lastAssignedId: string | null;
};

const initialState: OpsState = {
  fleet: SEED_FLEET,
  users: SEED_USERS,
  lastAssignedId: null,
};

const inYard = (b: Bus) => b.status === STATUS.arrived || b.status === STATUS.boarding;

const opsSlice = createSlice({
  name: "ops",
  initialState,
  reducers: {
    /** Gate In: assign the next free slot. No-op when the yard is full. */
    assignSlot(state, action: PayloadAction<string>) {
      const bus = state.fleet.find((b) => b.id === action.payload);
      if (!bus || bus.status !== STATUS.waiting) return;

      const slot = nextFreeSlot(state.fleet.filter(inYard).map((b) => ({ slot: b.slot! })));
      if (slot === null) return;

      bus.slot = slot;
      bus.status = STATUS.arrived;
      bus.arrivedAt = Date.now();
      state.lastAssignedId = bus.id;
    },

    startBoarding(state, action: PayloadAction<string>) {
      const bus = state.fleet.find((b) => b.id === action.payload);
      if (bus?.status === STATUS.arrived) bus.status = STATUS.boarding;
    },

    /** Gate Out: departure frees the slot for the next arrival. */
    markDeparted(state, action: PayloadAction<string>) {
      const bus = state.fleet.find((b) => b.id === action.payload);
      if (!bus || !inYard(bus)) return;
      bus.status = STATUS.departed;
      bus.departedAt = Date.now();
      if (state.lastAssignedId === bus.id) state.lastAssignedId = null;
    },

    undoLastAssignment(state) {
      const bus = state.fleet.find((b) => b.id === state.lastAssignedId);
      if (!bus || !inYard(bus)) return;
      bus.slot = null;
      bus.status = STATUS.waiting;
      bus.arrivedAt = null;
      state.lastAssignedId = null;
    },

    /**
     * Breakdown handling: the reserve bus inherits the route and the slot, so
     * students keep watching the same station number on the board.
     */
    replaceBus(state, action: PayloadAction<{ originalId: string; reserveId: string }>) {
      const original = state.fleet.find((b) => b.id === action.payload.originalId);
      const reserve = state.fleet.find((b) => b.id === action.payload.reserveId);
      if (!original || !reserve || reserve.status !== STATUS.waiting) return;

      reserve.route = original.route;
      reserve.slot = original.slot;
      reserve.status = original.slot === null ? STATUS.waiting : STATUS.arrived;
      reserve.arrivedAt = original.slot === null ? null : Date.now();

      original.status = STATUS.replaced;
      original.replacedByNo = reserve.no;
      original.departedAt = Date.now();
    },

    /** End of day: clear the yard and put every bus back to Waiting. */
    resetDay(state) {
      state.fleet = SEED_FLEET.map((b) => ({ ...b }));
      state.lastAssignedId = null;
    },
  },
});

export const {
  assignSlot,
  startBoarding,
  markDeparted,
  undoLastAssignment,
  replaceBus,
  resetDay,
} = opsSlice.actions;

export default opsSlice.reducer;

// ── selectors ──────────────────────────────────────────────────────────────
const selectFleet = (s: RootState) => s.ops.fleet;

export const selectYard = createSelector([selectFleet], (fleet) =>
  fleet.filter(inYard).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)),
);

export const selectWaiting = createSelector([selectFleet], (fleet) =>
  fleet.filter((b) => b.status === STATUS.waiting && !b.reserve),
);

export const selectReserves = createSelector([selectFleet], (fleet) =>
  fleet.filter((b) => b.reserve && b.status === STATUS.waiting),
);

/** Board order: active work at the top, departures sink to the bottom. */
export const selectBoard = createSelector([selectFleet], (fleet) =>
  fleet
    .filter((b) => b.status !== STATUS.waiting)
    .sort(
      (a, z) =>
        STATUS_RANK[a.status] - STATUS_RANK[z.status] || (a.slot ?? 99) - (z.slot ?? 99),
    ),
);

export const selectNextSlot = createSelector([selectYard], (yard) =>
  nextFreeSlot(yard.map((b) => ({ slot: b.slot! }))),
);

export const selectStats = createSelector([selectFleet], (fleet) => ({
  total: fleet.filter((b) => !b.reserve).length,
  inYard: fleet.filter(inYard).length,
  departed: fleet.filter((b) => b.status === STATUS.departed).length,
  waiting: fleet.filter((b) => b.status === STATUS.waiting && !b.reserve).length,
}));
