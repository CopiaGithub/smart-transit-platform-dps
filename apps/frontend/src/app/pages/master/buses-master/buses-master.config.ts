import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel, toId } from '../location-masters/location-lookups';
import {
  BUS_TYPE_OPTIONS,
  OUT_OF_SERVICE_STATES,
  ROUTE_LOOKUP,
  SERVICE_STATUS_OPTIONS,
  serviceStatusLabel,
} from '../transport-masters/transport-lookups';

/**
 * D2 — Buses Master / Fleet (WEB-APP-SCREENS.docx §Group D).
 *
 * Two distinctions this form must not blur:
 *
 *  - BusNumber is the short code on the LED board and the only key used at the
 *    gate. RegistrationNumber is the RTO plate — a fleet record for insurance
 *    and police, never used to identify a bus at the gate.
 *
 *  - IsActive=false retires the bus from the fleet. ServiceStatus =
 *    Maintenance/Breakdown means it cannot run today but is still on the roster.
 *    They are different things, so they get two separate controls.
 *
 * Note: the docx lists BusType and ServiceStatus as list filters, but
 * BusesMasterController accepts only routeId and status on top of the standard
 * pagination filter. They are omitted rather than filtered client-side — the
 * server owns filtering, and a client-side filter would silently only cover the
 * page in hand.
 */
export const BUSES_MASTER_CONFIG: MasterPageConfig = {
  title: 'Buses Master',
  singular: 'Bus',
  listTitle: 'Fleet List',
  resource: 'BusesMaster',
  defaultSortBy: 'BusNumber',
  exportFileName: 'Buses_Master',

  entityLabel: (row) => row.BusNumber,

  columns: [
    { key: 'BusNumber', label: 'Bus No', width: '120px' },
    { key: 'RegistrationNumber', label: 'Reg No', width: '150px' },
    { key: 'BusType', label: 'Type', width: '110px', type: 'badge' },
    { key: 'RouteName', label: 'Route' },
    { key: 'ServiceStatusLabel', label: 'Service Status', width: '150px', type: 'badge' },
    { key: 'Capacity', label: 'Capacity', width: '110px' },
    { key: 'DriverName', label: 'Driver' },
    { key: 'DriverPhone', label: 'Driver Phone', width: '150px' },
    { key: 'Status', label: 'Active', width: '110px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    {
      name: 'route',
      label: 'Route',
      type: 'dropdown',
      queryParam: 'routeId',
      optionsFrom: 'route',
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  lookups: { route: ROUTE_LOOKUP },

  fields: [
    {
      name: 'BusNumber',
      label: 'Bus Number',
      type: 'text',
      required: true,
      maxLength: 20,
    },
    {
      name: 'RegistrationNumber',
      label: 'Registration Number',
      type: 'text',
      maxLength: 20,
    },
    // Reserve buses usually have no route of their own.
    { name: 'RouteId', label: 'Route', type: 'dropdown', optionsFrom: 'route' },
    {
      name: 'BusType',
      label: 'Bus Type',
      type: 'dropdown',
      required: true,
      optionsList: BUS_TYPE_OPTIONS,
      value: 'Active',
    },
    {
      name: 'ServiceStatus',
      label: 'Service Status',
      type: 'dropdown',
      required: true,
      optionsList: SERVICE_STATUS_OPTIONS,
      value: 'InService',
    },
    {
      name: 'OutOfServiceReason',
      label: 'Out of Service Reason',
      type: 'text',
      required: true,
      maxLength: 200,
      // Only asked for — and only required — when the bus cannot run today.
      visibleWhen: { field: 'ServiceStatus', equals: OUT_OF_SERVICE_STATES },
    },
    { name: 'Capacity', label: 'Capacity', type: 'number' },
    { name: 'DriverName', label: 'Driver Name', type: 'text', maxLength: 100 },
    // A gate operator calls this number during a breakdown.
    { name: 'DriverPhone', label: 'Driver Phone', type: 'text', maxLength: 20 },
    {
      name: 'DriverLicenceNumber',
      label: 'Driver Licence Number',
      type: 'text',
      maxLength: 30,
    },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['BusNumber'],

  toRow: (item) => ({
    id: item.Id,
    BusNumber: item.BusNumber,
    RegistrationNumber: item.RegistrationNumber ?? '-',
    BusType: item.BusType,
    RouteId: item.RouteId,
    RouteName: item.RouteName ?? '-',
    ServiceStatus: item.ServiceStatus,
    ServiceStatusLabel: serviceStatusLabel(item.ServiceStatus),
    OutOfServiceReason: item.OutOfServiceReason ?? '',
    Capacity: item.Capacity ?? '-',
    DriverName: item.DriverName ?? '-',
    DriverPhone: item.DriverPhone ?? '-',
    DriverLicenceNumber: item.DriverLicenceNumber ?? '',
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    BusNumber: row.BusNumber,
    RegistrationNumber: blank(row.RegistrationNumber),
    RouteId: row.RouteId,
    BusType: row.BusType,
    ServiceStatus: row.ServiceStatus,
    OutOfServiceReason: row.OutOfServiceReason,
    Capacity: row.Capacity === '-' ? null : row.Capacity,
    DriverName: blank(row.DriverName),
    DriverPhone: blank(row.DriverPhone),
    DriverLicenceNumber: row.DriverLicenceNumber,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    BusNumber: result.BusNumber,
    RegistrationNumber: result.RegistrationNumber || null,
    RouteId: toId(result.RouteId),
    BusType: result.BusType,
    ServiceStatus: result.ServiceStatus,
    OutOfServiceReason: outOfServiceReason(result),
    Capacity: toNumber(result.Capacity),
    DriverName: result.DriverName || null,
    DriverPhone: result.DriverPhone || null,
    DriverLicenceNumber: result.DriverLicenceNumber || null,
  }),

  toUpdate: (result) => ({
    BusNumber: result.BusNumber,
    RegistrationNumber: result.RegistrationNumber || null,
    RouteId: toId(result.RouteId),
    BusType: result.BusType,
    ServiceStatus: result.ServiceStatus,
    OutOfServiceReason: outOfServiceReason(result),
    Capacity: toNumber(result.Capacity),
    DriverName: result.DriverName || null,
    DriverPhone: result.DriverPhone || null,
    DriverLicenceNumber: result.DriverLicenceNumber || null,
    IsActive: result.IsActive,
  }),
};

/** Same coercion as toId, named for what it actually is here. */
const toNumber = toId;

/** Cleared whenever the bus is back in service, so no stale reason lingers. */
function outOfServiceReason(result: any): string | null {
  return OUT_OF_SERVICE_STATES.includes(result.ServiceStatus)
    ? result.OutOfServiceReason || null
    : null;
}

/** The list renders missing values as '-'; the form must not echo that back. */
function blank(value: unknown): string {
  return value === '-' || value == null ? '' : String(value);
}
