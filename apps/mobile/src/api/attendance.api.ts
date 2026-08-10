import { api } from "../services/apiClient";

/**
 * Class attendance. Types mirror the server DTOs in
 * Services/AttendanceService/AttendanceModel.cs by name.
 */

/** A standard-and-division pair that actually has students on the roll. */
export type ClassRow = {
  Grade: string;
  Division: string;
  StudentCount: number;
};

export type RosterStudent = {
  StudentId: number;
  AdmissionNumber: string;
  Name: string;
  /** The child's face. Null for most of them — the list falls back to initials. */
  PhotoUrl: string | null;
  /** Null when nobody has marked this child yet — not the same as absent. */
  IsPresent: boolean | null;
  /** The bus this child rides home. Null for one who is not on transport. */
  BusNumber: string | null;
  RouteName: string | null;
};

export type Roster = {
  /** Calendar date, `2026-08-07`. The school's own, not the phone's. */
  AttendanceDate: string;
  Grade: string;
  Division: string;
  AcademicYearId: number;
  AcademicYearName: string | null;
  TotalStudents: number;
  PresentCount: number;
  AbsentCount: number;
  UnmarkedCount: number;
  /** False until someone has saved this class for this date. */
  IsMarked: boolean;
  LastMarkedAt: string | null;
  LastMarkedBy: string | null;
  Students: RosterStudent[];
};

/** A child who is on a bus's roll but did not come to school today. */
export type Absentee = {
  StudentId: number;
  AdmissionNumber: string;
  Name: string;
  /** Already formatted by the server, e.g. "5-A". */
  Class: string;
};

/**
 * One bus's roll for today.
 *
 * Carries counts and the absentees only — never the whole roll. A teacher at the
 * platform cannot read thirty names while the yard is emptying; the number says
 * whether anything is wrong and the short list says who not to wait for.
 */
export type BusRollCall = {
  BusId: number;
  BusNumber: string;
  RouteName: string | null;
  /** Everyone whose record puts them on this bus, present or not. */
  TotalStudents: number;
  PresentCount: number;
  AbsentCount: number;
  /**
   * On this bus but their class has not been marked yet. Deliberately not folded
   * into present — nobody has said these children are in school.
   */
  UnmarkedCount: number;
  Absentees: Absentee[];
};

export type SaveAttendanceRequest = {
  grade: string;
  division: string;
  /** Omitted means the school's today, which the server decides. */
  attendanceDate?: string;
  marks: { studentId: number; isPresent: boolean }[];
};

export const attendanceApi = {
  /** The pickers are built from this — standards are not a master table. */
  classes: () => api.get<ClassRow[]>("Attendance/classes"),

  roster: (grade: string, division: string, date?: string) =>
    api.get<Roster>("Attendance/roster", { grade, division, date }),

  /** Answers with the roster as it now stands, so the screen never guesses. */
  save: (body: SaveAttendanceRequest) => api.post<Roster>("Attendance", body),

  /**
   * Today's attendance per bus. Read once when the boarding screen opens rather
   * than polled: a class is marked in the morning and does not change while the
   * yard is emptying.
   */
  byBus: (date?: string) => api.get<BusRollCall[]>("Attendance/by-bus", { date }),
};
