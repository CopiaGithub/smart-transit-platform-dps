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
};
