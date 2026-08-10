import AsyncStorage from "@react-native-async-storage/async-storage";
import { attendanceApi, type Roster, type SaveAttendanceRequest } from "../api/attendance.api";
import { ApiError, NetworkError } from "../api/types";

/**
 * Attendance that has not reached the server yet.
 *
 * A teacher marking thirty-four children has spent real minutes on it. If the
 * network drops on the last tap, none of that may be lost — so every tap is
 * written to the phone, the class list is kept with it, and pressing Save with
 * no signal parks the class here instead of failing.
 *
 * Two states, one list:
 *
 * - `filed: false` — a class the teacher is still working through. Restored
 *   when they come back to it, never sent on its own. Sending a half-marked
 *   class would file everyone they had not reached yet as present.
 * - `filed: true` — they pressed Save. That is the intent to record it, so it
 *   goes up on its own as soon as there is a network again.
 *
 * Replaying a save is safe: the server upserts on (studentId, attendanceDate)
 * — unique index `UX_student_attendance_Student_Date` — so the same class
 * arriving twice rewrites the same rows rather than doubling them. That is why
 * this may retry a write when `apiClient` deliberately will not.
 *
 * The date is always carried explicitly. A class marked at five and synced the
 * next morning must land on the day it was taken, not the day it was sent.
 */

const KEY = "attendance.pending";

export type PendingSave = {
  save: SaveAttendanceRequest;
  /** The class as the server last described it, so it can be shown offline. */
  roster: Roster;
  /** True once the teacher pressed Save. Only these are sent by `flush`. */
  filed: boolean;
  /** When they marked it, not when it reached the server. */
  markedAt: string;
};

/** One entry per class per date; a later marking replaces an earlier one. */
const idOf = (s: SaveAttendanceRequest) => `${s.grade}|${s.division}|${s.attendanceDate ?? ""}`;

// ponytail: one write at a time. Read-modify-write against AsyncStorage from a
// fast tapping finger drops marks otherwise — swap for a real transaction only
// if this ever writes from more than one screen.
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(job: () => Promise<T>): Promise<T> {
  const next = chain.then(job, job);
  chain = next.catch(() => undefined);
  return next;
}

export async function readPending(): Promise<PendingSave[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    // Entries written by an older build may not have a roster; they would
    // blank the screen rather than fill it.
    return Array.isArray(list) ? list.filter((p) => p?.save && p?.roster) : [];
  } catch {
    // A corrupt store is not worth a crash in front of a class. The teacher
    // re-marks; nothing else in the app depends on this.
    return [];
  }
}

const write = (list: PendingSave[]) => AsyncStorage.setItem(KEY, JSON.stringify(list));

/** Records the current marks for a class. `filed` says whether to send them. */
export function stash(save: SaveAttendanceRequest, roster: Roster, filed: boolean): Promise<void> {
  return serial(async () => {
    const list = await readPending();
    await write([
      ...list.filter((p) => idOf(p.save) !== idOf(save)),
      { save, roster, filed, markedAt: new Date().toISOString() },
    ]);
  });
}

/**
 * What is held for one class, so the screen can restore the teacher's taps.
 * Without a date, the most recently marked entry for that class — which is how
 * a screen opened with no network finds yesterday's unsent roll.
 */
export async function pendingFor(
  grade: string,
  division: string,
  attendanceDate?: string,
): Promise<PendingSave | null> {
  const matches = (await readPending()).filter(
    (p) =>
      p.save.grade === grade &&
      p.save.division === division &&
      (attendanceDate === undefined || (p.save.attendanceDate ?? "") === attendanceDate),
  );
  return matches.sort((a, b) => (a.markedAt < b.markedAt ? 1 : -1))[0] ?? null;
}

export function drop(save: SaveAttendanceRequest) {
  return serial(async () => {
    const list = await readPending();
    await write(list.filter((p) => idOf(p.save) !== idOf(save)));
  });
}

export type FlushResult = {
  /** Classes that reached the server. */
  sent: number;
  /** Still waiting — no network, or the session needs signing in again. */
  held: number;
  /** Classes the server refused; these will never succeed on a replay. */
  refused: string[];
};

/**
 * Sends every filed class that is still waiting. Safe to call often — with
 * nothing filed it is a single storage read.
 */
export function flush(): Promise<FlushResult> {
  return serial(async () => {
    const list = await readPending();
    if (!list.some((p) => p.filed)) return { sent: 0, held: 0, refused: [] };

    const keep: PendingSave[] = [];
    const refused: string[] = [];
    let sent = 0;

    for (const entry of list) {
      if (!entry.filed) {
        keep.push(entry);
        continue;
      }

      try {
        await attendanceApi.save(entry.save);
        sent++;
      } catch (error) {
        // No network, or a dead token — both are temporary, so the marks stay.
        // A server refusal ("nobody is on that roll") will say the same thing
        // on every replay, so it is reported once and let go.
        if (error instanceof NetworkError || (error instanceof ApiError && error.isSessionExpired)) {
          keep.push(entry);
        } else {
          refused.push(
            `${entry.save.grade}-${entry.save.division}: ${
              error instanceof ApiError ? error.message : "could not be saved"
            }`,
          );
        }
      }
    }

    await write(keep);
    return { sent, held: keep.filter((p) => p.filed).length, refused };
  });
}
