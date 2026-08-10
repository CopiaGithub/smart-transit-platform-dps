import { api } from "../services/apiClient";

/** The parent record behind a sign-in account. */
export type Parent = {
  Id: number;
  FullName: string;
  MobileNumber: string;
  Email: string | null;
  UserId: number | null;
};

/**
 * One child as their parent sees them. Carries the bus and route already, so
 * the parent screen needs no second lookup for the child's service — only the
 * live board for where that bus is right now.
 */
export type ParentChild = {
  StudentId: number;
  AdmissionNumber: string;
  StudentName: string;
  /** Already formatted by the server, e.g. "5-A". */
  Class: string;
  /** The child's face. Null for most of them — the card falls back to initials. */
  PhotoUrl: string | null;
  Relation: string;
  IsPrimaryContact: boolean;
  IsAuthorisedForPickup: boolean;
  BusNumber: string | null;
  RouteName: string | null;
  ExitGateName: string | null;
};

export const peopleApi = {
  /**
   * How the parent app finds itself: the token carries a userId and nothing
   * else. Matching on mobile instead would break the moment an admin corrected
   * that number in one table and not the other.
   */
  parentByUser: (userId: number) => api.get<Parent>(`ParentMaster/by-user/${userId}`),

  children: (parentId: number) => api.get<ParentChild[]>(`ParentMaster/${parentId}/children`),
};
