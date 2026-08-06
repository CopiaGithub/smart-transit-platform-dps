import { createSelector, createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import { LABELS, ROLES, SLOT_COUNT, STATUS, STATUS_RANK } from "../../constants/domain";
import { isNoTaken, nextFreeSlot } from "../domain/allocation";
import { SEED_FLEET, SEED_USERS, type Bus, type Operator } from "../data/seed";
import type { RootState } from ".";

/** The four fields any gate/boarding tap touches — enough to put one back. */
type Snapshot = Pick<Bus, "status" | "slot" | "arrivedAt" | "departedAt">;

type OpsState = {
  fleet: Bus[];
  users: typeof SEED_USERS;
  /**
   * Single-step undo. Taps are one-touch and deliberately unconfirmed so 45
   * buses clear in fifteen minutes; the snapshot is what makes that safe.
   */
  lastAction: { busId: string; label: string; prev: Snapshot } | null;
};

const initialState: OpsState = {
  fleet: SEED_FLEET,
  users: SEED_USERS,
  lastAction: null,
};

const onCampus = (b: Bus) => b.status === STATUS.arrived || b.status === STATUS.boarding;

const snap = (b: Bus): Snapshot => ({
  status: b.status,
  slot: b.slot,
  arrivedAt: b.arrivedAt,
  departedAt: b.departedAt,
});

const opsSlice = createSlice({
  name: "ops",
  initialState,
  reducers: {
    /**
     * Entry gate: the guard types the number, the station is allocated here.
     * Rejects a bus that is already inside — the one mistake a guard makes
     * when two buses roll up together.
     */
    gateIn(state, action: PayloadAction<string>) {
      const bus = state.fleet.find((b) => b.id === action.payload);
      if (!bus || bus.status !== null) return;

      const slot = nextFreeSlot(state.fleet.filter(onCampus).map((b) => ({ slot: b.slot! })));
      if (slot === null || slot > SLOT_COUNT) return;

      state.lastAction = { busId: bus.id, label: `${LABELS.vehicle} ${bus.no} in`, prev: snap(bus) };
      bus.slot = slot;
      bus.status = STATUS.arrived;
      bus.arrivedAt = Date.now();
    },

    /** Teacher / driver: students are climbing in. */
    startBoarding(state, action: PayloadAction<string>) {
      const bus = state.fleet.find((b) => b.id === action.payload);
      if (bus?.status !== STATUS.arrived) return;
      state.lastAction = {
        busId: bus.id,
        label: `${LABELS.vehicle} ${bus.no} boarding`,
        prev: snap(bus),
      };
      bus.status = STATUS.boarding;
    },

    /** Exit gate: departure frees the station for the next arrival. */
    gateOut(state, action: PayloadAction<string>) {
      const bus = state.fleet.find((b) => b.id === action.payload);
      if (!bus || !onCampus(bus)) return;
      state.lastAction = { busId: bus.id, label: `${LABELS.vehicle} ${bus.no} out`, prev: snap(bus) };
      bus.status = STATUS.departed;
      bus.departedAt = Date.now();
    },

    /** Puts the last tap back exactly as it was, whichever screen made it. */
    undoLast(state) {
      const last = state.lastAction;
      if (!last) return;
      const bus = state.fleet.find((b) => b.id === last.busId);
      if (bus) Object.assign(bus, last.prev);
      state.lastAction = null;
    },

    /**
     * Breakdown handling: the reserve bus inherits the route and the station,
     * so students keep watching the same number on the board. The bus going
     * out of service is simply Departed — there is no fourth status.
     */
    replaceBus(state, action: PayloadAction<{ originalId: string; reserveId: string }>) {
      const original = state.fleet.find((b) => b.id === action.payload.originalId);
      const reserve = state.fleet.find((b) => b.id === action.payload.reserveId);
      if (!original || !reserve || reserve.status !== null) return;

      reserve.route = original.route;
      reserve.slot = original.slot;
      reserve.status = original.slot === null ? null : STATUS.arrived;
      reserve.arrivedAt = original.slot === null ? null : Date.now();

      original.status = STATUS.departed;
      original.replacedByNo = reserve.no;
      original.departedAt = Date.now();
    },

    /** End of day: clear the campus and put every bus back to not-arrived. */
    resetDay(state) {
      state.fleet = SEED_FLEET.map((b) => ({ ...b }));
      state.lastAction = null;
    },

    // ── masters ────────────────────────────────────────────────────────────
    /** Add when there is no id, otherwise edit. Never touches live status. */
    saveBus(
      state,
      action: PayloadAction<{ id?: string; no: string; route: string; reserve: boolean }>,
    ) {
      const { id, no, route, reserve } = action.payload;
      // The keypad cannot tell 5 from 05, so a collision must never land.
      if (isNoTaken(state.fleet, no, id)) return;

      if (!id) {
        state.fleet.push({
          id: nanoid(),
          no,
          route,
          reserve,
          slot: null,
          status: null,
          arrivedAt: null,
          departedAt: null,
        });
        return;
      }

      const bus = state.fleet.find((b) => b.id === id);
      if (!bus) return;
      // Renumbering a bus students are watching on the board would strand
      // them; the route text can still be corrected mid-dispersal.
      if (!onCampus(bus)) bus.no = no;
      bus.route = route;
      bus.reserve = reserve;
    },

    /** A bus standing on a station cannot be deleted — it is on the board. */
    removeBus(state, action: PayloadAction<string>) {
      const bus = state.fleet.find((b) => b.id === action.payload);
      if (!bus || onCampus(bus)) return;
      state.fleet = state.fleet.filter((b) => b.id !== action.payload);
      if (state.lastAction?.busId === action.payload) state.lastAction = null;
    },

    saveUser(state, action: PayloadAction<Omit<Operator, "id"> & { id?: string }>) {
      const { id, name, username, mobile, role } = action.payload;
      // Only a guard is posted to a gate; anyone else keeps null.
      const gateId = role === ROLES.security ? action.payload.gateId : null;
      const fields = { name, username: username.toLowerCase(), mobile, role, gateId };

      if (!id) {
        state.users.push({ id: nanoid(), ...fields });
        return;
      }
      const user = state.users.find((u) => u.id === id);
      if (user) Object.assign(user, fields);
    },

    removeUser(state, action: PayloadAction<string>) {
      state.users = state.users.filter((u) => u.id !== action.payload);
    },
  },
});

export const {
  gateIn,
  startBoarding,
  gateOut,
  undoLast,
  replaceBus,
  resetDay,
  saveBus,
  removeBus,
  saveUser,
  removeUser,
} = opsSlice.actions;

export default opsSlice.reducer;

// ── selectors ──────────────────────────────────────────────────────────────
const selectFleet = (s: RootState) => s.ops.fleet;

/** Everything inside the compound right now, in station order. */
export const selectOnCampus = createSelector([selectFleet], (fleet) =>
  fleet.filter(onCampus).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)),
);

/** Buses that have not reached the entry gate yet. */
export const selectAwaited = createSelector([selectFleet], (fleet) =>
  fleet.filter((b) => b.status === null && !b.reserve),
);

export const selectReserves = createSelector([selectFleet], (fleet) =>
  fleet.filter((b) => b.reserve && b.status === null),
);

/** The LED board: active work at the top, departures sink to the bottom. */
export const selectBoard = createSelector([selectFleet], (fleet) =>
  fleet
    .filter((b) => b.status !== null)
    .sort(
      (a, z) =>
        STATUS_RANK[a.status!] - STATUS_RANK[z.status!] || (a.slot ?? 99) - (z.slot ?? 99),
    ),
);

export const selectNextSlot = createSelector([selectOnCampus], (yard) =>
  nextFreeSlot(yard.map((b) => ({ slot: b.slot! }))),
);

/** Buses the exit guard can act on: ready-to-leave first, then by number. */
export const selectReadyToLeave = createSelector([selectOnCampus], (yard) =>
  [...yard].sort(
    (a, z) =>
      STATUS_RANK[a.status!] - STATUS_RANK[z.status!] || Number(a.no) - Number(z.no),
  ),
);

export const selectStats = createSelector([selectFleet], (fleet) => ({
  total: fleet.filter((b) => !b.reserve).length,
  // The three statuses, counted exclusively so they never double up.
  arrived: fleet.filter((b) => b.status === STATUS.arrived).length,
  boarding: fleet.filter((b) => b.status === STATUS.boarding).length,
  departed: fleet.filter((b) => b.status === STATUS.departed).length,
  /** Physical occupancy, not a status: arrived + boarding hold a station. */
  onCampus: fleet.filter(onCampus).length,
  awaited: fleet.filter((b) => b.status === null && !b.reserve).length,
}));
