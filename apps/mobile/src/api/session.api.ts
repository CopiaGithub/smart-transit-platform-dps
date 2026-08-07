import { api } from "../services/apiClient";
import { ApiError } from "./types";

/** Session status values the server accepts (manual §8.3). */
export const SESSION_STATUS = { open: "Open", closed: "Closed" } as const;

export type DispersalSession = {
  Id: number;
  SessionDate: string;
  ShiftName: string | null;
  StartedAt: string | null;
  EndedAt: string | null;
  Status: string;
  ResetAt: string | null;
  TotalBuses: number;
  InYard: number;
  Waiting: number;
  Departed: number;
  IsActive: boolean;
};

export type OpenSessionRequest = {
  /** yyyy-MM-dd. Server defaults to today. */
  sessionDate?: string;
  /** Server defaults to "Afternoon Pickup". */
  shiftName?: string;
};

export const sessionApi = {
  /**
   * The open session, or null when there is none.
   *
   * "No session open" is a normal state at the start of every afternoon, not a
   * failure — but the server reports it as 404 because there is genuinely no
   * resource. Translating it to null here keeps that decision out of every
   * screen; anything else still throws.
   */
  async getCurrent(): Promise<DispersalSession | null> {
    try {
      return await api.get<DispersalSession>("DispersalSession/current");
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) return null;
      throw error;
    }
  },

  /** Admin and the Gate 6 operator only — the server enforces it too (§6). */
  open: (body: OpenSessionRequest = {}) =>
    api.post<DispersalSession>("DispersalSession/open", body),

  /** Refused, naming them, while any bus is still in the compound (§5.10). */
  close: (id: number) => api.post<DispersalSession>(`DispersalSession/${id}/close`),

  /** Admin only. Departs anything still holding a platform and stamps the session. */
  reset: (id: number) => api.post<DispersalSession>(`DispersalSession/${id}/reset`),
};
