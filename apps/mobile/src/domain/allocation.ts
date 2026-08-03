import { SLOT_COUNT } from "../../constants/domain";

export type Occupancy = { slot: number }[];

/**
 * The compound is single-file with no overtaking: slot 1 sits deepest (at the
 * boarding point) and slot 23 nearest the exit gate, so an arriving bus takes
 * the lowest free slot. Departures happen in the same order, which is what
 * keeps that physically possible.
 *
 * Returns null when every slot is taken — the yard holds more buses than it
 * has marked slots, so "full" is a real operating state, not an error.
 */
export function nextFreeSlot(
  occupied: Occupancy,
  slotCount: number = SLOT_COUNT,
): number | null {
  const taken = new Set(occupied.map((o) => o.slot));
  for (let n = 1; n <= slotCount; n++) {
    if (!taken.has(n)) return n;
  }
  return null;
}

/** A departure frees only that slot — the queue behind it does not shuffle up. */
export function releaseSlot(occupied: Occupancy, slot: number): Occupancy {
  return occupied.filter((o) => o.slot !== slot);
}

// ponytail: run with `npx tsx src/domain/allocation.ts` — no test framework.
export function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("allocation: " + msg);
  };

  assert(nextFreeSlot([]) === 1, "empty yard starts at slot 1");
  assert(nextFreeSlot([{ slot: 1 }, { slot: 2 }]) === 3, "fills sequentially");

  // A mid-queue departure reopens exactly that slot, and it is reused next.
  const afterExit = releaseSlot([{ slot: 1 }, { slot: 2 }, { slot: 3 }], 2);
  assert(afterExit.length === 2, "release removes one entry");
  assert(nextFreeSlot(afterExit) === 2, "freed slot is reused before slot 4");

  // Releasing something that was never taken must not corrupt the list.
  assert(releaseSlot([{ slot: 5 }], 9).length === 1, "unknown slot is a no-op");

  // Full yard: the caller has to hold the bus, so it must get null, not 24.
  const full = Array.from({ length: SLOT_COUNT }, (_, i) => ({ slot: i + 1 }));
  assert(nextFreeSlot(full) === null, "full yard returns null");
  assert(nextFreeSlot(full.slice(1)) === 1, "one departure reopens slot 1");

  return "allocation: all checks passed";
}

if (require.main === module) console.log(selfCheck());
