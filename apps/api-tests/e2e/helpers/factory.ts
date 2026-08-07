import { env } from '../config/env';

/**
 * Every row this suite creates carries a run-unique key, for two reasons.
 *
 * 1. The schema hardening added 17 unique indexes — BusNumber, PlatformNumber,
 *    RouteCode, GateCode, DisplayCode, YearName, EmployeeCode, EmailId, RfidTag,
 *    ParentMaster.MobileNumber, (AdmissionNumber, AcademicYearId), (StudentId,
 *    ParentId). A fixed literal like the Postman collection's "EXIT3" creates fine on
 *    the first run and fails on every run after it, with an error that reads like a
 *    broken endpoint rather than a re-used key.
 * 2. Deletes are soft, so nothing is ever cleaned up and rows must stay traceable to
 *    the run that made them. (The unique indexes are all filtered on `IsDeleted = 0`,
 *    so a completed run does give its keys back — but a run that fails half way does not.)
 *
 * The code columns are TIGHT: GateCode, DisplayCode, BusNumber and GateType are
 * MaxLength(20), PlatformName 50, and AcademicYearMaster.YearName is MaxLength(9),
 * which has room for "2040-2041" and nothing else. So the marker is base36 and short,
 * not a readable timestamp.
 */

/** 6-char base36 seed derived from the run id. Short enough for a MaxLength(20) code. */
export const RUN_MARKER = (() => {
  let hash = 0;
  for (const ch of env.runId) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  return hash.toString(36).toUpperCase().padStart(6, '0').slice(-6);
})();

let counter = 0;
const seq = (): number => ++counter;

/**
 * Unique code for a MaxLength(20) column: `prefix + marker + sequence`.
 * e.g. `uniqCode('EXIT')` → `EXIT1F3K9A1` (11 chars).
 */
export function uniqCode(prefix: string): string {
  const code = `${prefix}${RUN_MARKER}${seq()}`;
  if (code.length > 20) throw new Error(`uniqCode("${prefix}") is ${code.length} chars; the column holds 20.`);
  return code;
}

/** Readable label for the roomy MaxLength(100) name columns. */
export const uniqName = (label: string): string => `${label} ${RUN_MARKER}-${seq()}`;

/** Numeric seed from the run marker, for the integer unique columns. */
const numericSeed = parseInt(RUN_MARKER, 36) || Math.floor(Math.random() * 1e6);

/**
 * Unique-per-run integer in [base, base + width). Seeded platforms are 1..23, so the
 * platform suite starts far above them.
 */
export const uniqNumber = (base: number, width: number): number =>
  base + ((numericSeed * 97 + seq() * 7919) % width);

/** 10-digit Indian mobile that cannot collide with the seeded 98210045xx block. */
export const uniqMobile = (): string => `7${String(uniqNumber(100000000, 899999999)).padStart(9, '0')}`;

/**
 * `YYYY-YYYY` for AcademicYearMaster.YearName — MaxLength(9), unique, and there is
 * literally nowhere to put a marker. Far past the seeded 2026-2027 so a collision
 * needs two runs to hash into the same slot within the same 50-year window.
 */
export function uniqYearName(): { yearName: string; startDate: string; endDate: string } {
  const start = 2040 + ((numericSeed + seq()) % 50);
  return {
    yearName: `${start}-${start + 1}`,
    startDate: `${start}-06-01`,
    endDate: `${start + 1}-04-30`,
  };
}
