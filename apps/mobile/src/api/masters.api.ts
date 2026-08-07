import { api } from "../services/apiClient";
import type { PagedQuery, PagedResult } from "./types";

/**
 * Master data. Every list takes the same query (§8.2) and every delete is a
 * soft delete — the record is hidden but preserved so past dispersal reports
 * still make sense.
 */

/** Values the server accepts (§8.3). */
export const BUS_TYPE = { active: "Active", reserve: "Reserve" } as const;
export const SERVICE_STATUS = {
  inService: "InService",
  maintenance: "Maintenance",
  breakdown: "Breakdown",
} as const;
export const PLATFORM_SIDE = { left: "Left", right: "Right" } as const;

export type BusMaster = {
  Id: number;
  BusNumber: string;
  /** RTO plate. Fleet record only — never used to identify a bus at the gate. */
  RegistrationNumber: string | null;
  RouteId: number | null;
  RouteName: string | null;
  BusType: string;
  ServiceStatus: string;
  OutOfServiceReason: string | null;
  Capacity: number | null;
  DriverName: string | null;
  DriverPhone: string | null;
  DriverLicenceNumber: string | null;
  IsActive: boolean;
};

export type BusMasterWrite = {
  busNumber: string;
  registrationNumber?: string | null;
  routeId?: number | null;
  busType: string;
  serviceStatus?: string;
  outOfServiceReason?: string | null;
  capacity?: number | null;
  driverName?: string | null;
  driverPhone?: string | null;
  driverLicenceNumber?: string | null;
  isActive?: boolean;
};

export type UserMaster = {
  Id: number;
  Name: string;
  Contact: string | null;
  EmailId: string | null;
  EmployeeCode: string | null;
  RoleId: number | null;
  RoleName: string | null;
  IsActive: boolean;
};

export type UserMasterWrite = {
  name: string;
  contact?: string | null;
  emailId?: string | null;
  /** Only on create — an admin sets a temporary password the user must change. */
  password?: string;
  employeeCode?: string | null;
  roleId?: number | null;
  isActive?: boolean;
};

export type RoleMaster = { Id: number; RoleName: string; IsActive: boolean };

export type RouteMaster = {
  Id: number;
  RouteCode: string | null;
  RouteName: string;
  LedDisplayName: string | null;
  IsActive: boolean;
};

export type DisplayMaster = {
  Id: number;
  DisplayCode: string;
  DisplayName: string;
  DisplayType: string;
  FilterByGateName: string | null;
  VisibleRowCount: number;
  LastHeartbeatAt: string | null;
  ConnectionStatus: string;
  IsActive: boolean;
};

/** Builds the CRUD calls every *Master controller exposes identically. */
function crud<TList, TWrite>(resource: string) {
  return {
    list: (query: PagedQuery = {}) => api.get<PagedResult<TList>>(resource, { ...query }),
    byId: (id: number) => api.get<TList>(`${resource}/${id}`),
    create: (body: TWrite) => api.post<TList>(resource, body),
    update: (id: number, body: Partial<TWrite>) => api.patch<boolean>(`${resource}/${id}`, body),
    /** Soft delete — hidden from lists, kept for history. */
    remove: (id: number) => api.delete<boolean>(`${resource}/${id}`),
  };
}

export const mastersApi = {
  buses: crud<BusMaster, BusMasterWrite>("BusesMaster"),
  users: crud<UserMaster, UserMasterWrite>("UserMaster"),
  routes: crud<RouteMaster, { routeCode?: string; routeName: string; ledDisplayName?: string }>(
    "RoutesMaster",
  ),
  roles: crud<RoleMaster, { roleName: string }>("RoleMaster"),
  displays: crud<DisplayMaster, never>("DisplayMaster"),
};
