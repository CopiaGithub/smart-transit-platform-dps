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

/**
 * Guards type on a keypad, so "5" has to find bus "05" and a stray leading
 * zero must not miss. Matching is on the numeric value, not the string.
 */
export function findByNo<T extends { no: string }>(fleet: T[], typed: string): T | null {
  const key = typed.replace(/^0+/, "");
  if (!key) return null;
  return fleet.find((b) => b.no.replace(/^0+/, "") === key) ?? null;
}

/**
 * Two buses the keypad cannot tell apart (5 and 05) would make gate-in pick
 * the wrong one, so the master form has to reject the duplicate on the same
 * rule the lookup uses. `exceptId` lets a bus keep its own number when edited.
 */
export function isNoTaken<T extends { id: string; no: string }>(
  fleet: T[],
  no: string,
  exceptId?: string,
): boolean {
  return findByNo(exceptId ? fleet.filter((b) => b.id !== exceptId) : fleet, no) !== null;
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

  // Keypad lookup: padded fleet numbers, unpadded typing, and no false hits.
  const fleet = [{ no: "05" }, { no: "24" }, { no: "R1" }];
  assert(findByNo(fleet, "5")?.no === "05", "unpadded input finds padded bus");
  assert(findByNo(fleet, "05")?.no === "05", "padded input still matches");
  assert(findByNo(fleet, "24")?.no === "24", "exact match works");
  assert(findByNo(fleet, "2") === null, "prefix must not match");
  assert(findByNo(fleet, "") === null, "empty input matches nothing");
  assert(findByNo(fleet, "0") === null, "a lone zero is not a bus");

  // Master form uniqueness runs on the same normalisation as the lookup.
  const master = [{ id: "a", no: "05" }, { id: "b", no: "24" }];
  assert(isNoTaken(master, "5"), "5 collides with existing 05");
  assert(isNoTaken(master, "05"), "exact duplicate is taken");
  assert(!isNoTaken(master, "7"), "a free number is not taken");
  assert(!isNoTaken(master, "05", "a"), "a bus may keep its own number");
  assert(isNoTaken(master, "24", "a"), "editing one bus still hits another");

  return "allocation: all checks passed";
}

if (require.main === module) console.log(selfCheck());
