import { api } from "../services/apiClient";

/**
 * Bus movements during a dispersal. Types mirror the server DTOs in
 * Services/BusOperationsService/BusOperationsModel.cs by name, so the two
 * sides stay greppable when either changes.
 */

/** One row of the airport-style board. */
export type BoardRow = {
  /** The boarding event — one bus in one session. NOT the bus id. */
  EventId: number;
  BusId: number;
  BusNumber: string;
  RouteId: number | null;
  RouteName: string | null;
  /** Uppercase form for the LED panel; falls back to RouteName. */
  LedDisplayName: string | null;
  PlatformId: number | null;
  PlatformNumber: number | null;
  PlatformName: string | null;
  /** Waiting | Arrived | Boarding | Departed | Replaced */
  Status: string;
  /** Server-decided order. Do not re-sort locally. */
  QueueOrder: number;
  EnteredAt: string;
  AssignedAt: string | null;
  DepartedAt: string | null;
  ReplacedByBusNumber: string | null;
};

export type Board = {
  SessionId: number;
  SessionDate: string;
  ShiftName: string | null;
  DisplayCode: string | null;
  DisplayName: string | null;
  FilteredByGateName: string | null;
  GeneratedAt: string;
  Rows: BoardRow[];
};

/** A bus that can still be recorded in at the gate. */
export type AvailableBus = {
  BusId: number;
  BusNumber: string;
  /** Active | Reserve */
  BusType: string;
  Capacity: number | null;
  DriverName: string | null;
  DriverPhone: string | null;
  RouteId: number | null;
  RouteName: string | null;
};

/** The gate operator's console: what is inside and what can still come in. */
export type OperatorQueue = {
  SessionId: number;
  PlatformCount: number;
  OccupiedCount: number;
  NextFreePlatformNumber: number | null;
  YardFull: boolean;
  /** Holding a platform — Arrived or Boarding. */
  Yard: BoardRow[];
  /** Inside but with no platform, because every platform is occupied. */
  Waiting: BoardRow[];
  AvailableBuses: AvailableBus[];
  AvailableReserves: AvailableBus[];
  /** Null when nothing can be undone — the console offers the button only then. */
  UndoableEventId: number | null;
};

export type PlatformSlot = {
  PlatformId: number;
  PlatformNumber: number;
  PlatformName: string | null;
  NearestGateId: number | null;
  IsOccupied: boolean;
  EventId: number | null;
  BusId: number | null;
  BusNumber: string | null;
  RouteName: string | null;
  Status: string | null;
  AssignedAt: string | null;
};

export type PlatformStatus = {
  SessionId: number;
  PlatformCount: number;
  OccupiedCount: number;
  AvailableCount: number;
  NextFreePlatformNumber: number | null;
  YardFull: boolean;
  Platforms: PlatformSlot[];
};

/** Operational state of a bus for the session (manual §5.8). */
export const AVAILABILITY = {
  available: "Available",
  waiting: "Waiting",
  inYard: "InYard",
  departed: "Departed",
  replaced: "Replaced",
  outOfService: "OutOfService",
  inactive: "Inactive",
} as const;

export type BusStatusRow = {
  BusId: number;
  BusNumber: string;
  BusType: string;
  IsActive: boolean;
  ServiceStatus: string;
  OutOfServiceReason: string | null;
  Availability: string;
  Capacity: number | null;
  DriverName: string | null;
  DriverPhone: string | null;
  RouteId: number | null;
  RouteName: string | null;
  CurrentEventId: number | null;
  CurrentStatus: string | null;
  CurrentPlatformNumber: number | null;
};

export type BusStatus = {
  /** Null when no session is open — then the rows are master data only. */
  SessionId: number | null;
  TotalBuses: number;
  AvailableCount: number;
  InYardCount: number;
  OutOfServiceCount: number;
  Buses: BusStatusRow[];
};

export type GateInRequest = {
  busId: number;
  /** Overrides the allocation — used when a reserve enters unassigned (§5.3). */
  routeId?: number;
  notes?: string;
};

export const operationsApi = {
  /** Everything a gate screen needs, in one call. Poll this. */
  getQueue: () => api.get<OperatorQueue>("BusOperations/queue"),

  /**
   * The LED board. Deliberately served without a login (§5.9) — an unattended
   * panel has no user to authenticate as, and the board carries only what is
   * already painted on the wall for everyone to read.
   */
  getBoard: (displayCode?: string) =>
    api.getPublic<Board>("BusOperations/board", { displayCode }),

  getBusStatus: () => api.get<BusStatus>("BusOperations/buses/status"),
  getPlatformStatus: () => api.get<PlatformStatus>("BusOperations/platforms/status"),

  /** Entry gate. The platform is allocated by the server, never chosen (§2.4). */
  gateIn: (body: GateInRequest) => api.post<BoardRow>("BusOperations/gate-in", body),

  /** Teacher or gate staff. Addressed by EVENT id, not bus id. */
  startBoarding: (eventId: number) =>
    api.post<BoardRow>(`BusOperations/${eventId}/boarding`),

  /** Exit gate. The bus is what the operator sees, so send the bus. */
  gateOut: (busId: number, notes?: string) =>
    api.post<BoardRow>("BusOperations/gate-out", { busId, notes }),

  /** The reserve inherits the failed bus's route and platform (§5.6). */
  replace: (eventId: number, reserveBusId: number, reason?: string) =>
    api.post<BoardRow>(`BusOperations/${eventId}/replace`, { reserveBusId, reason }),

  /** Single step, and only while the bus is still Arrived (§5.7). */
  undoLast: () => api.post<BoardRow>("BusOperations/undo-last"),
};
