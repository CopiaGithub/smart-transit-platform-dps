import { DropdownModel } from '../../../components/constants';
import { LookupConfig } from '../../../core/api/lookup.service';

/** Shared by the Group D transport masters. */

export const ROUTE_LOOKUP: LookupConfig = {
  resource: 'RoutesMaster',
  labelField: 'RouteName',
  codeField: 'RouteCode',
};

export const BUS_LOOKUP: LookupConfig = {
  resource: 'BusesMaster',
  labelField: 'BusNumber',
};

/**
 * Server-accepted enum values. These strings are also baked into filtered unique
 * index predicates in ApplicationDbContext, so they are not free text — see
 * apps/backend/Schema/BoardingStatus.cs and the BusKind / BusServiceState
 * constants beside it.
 */
export const BUS_TYPE_OPTIONS: DropdownModel[] = [
  { name: 'Active', value: 'Active' },
  { name: 'Reserve', value: 'Reserve' },
];

export const SERVICE_STATUS_OPTIONS: DropdownModel[] = [
  { name: 'In Service', value: 'InService' },
  { name: 'Maintenance', value: 'Maintenance' },
  { name: 'Breakdown', value: 'Breakdown' },
];

/** Standing = permanent, open-ended. Override = a single date, and it wins for that date. */
export const ALLOCATION_TYPE_OPTIONS: DropdownModel[] = [
  { name: 'Standing', value: 'Standing' },
  { name: 'Override', value: 'Override' },
];

/** The two states a bus can be out of service in — used for conditional fields. */
export const OUT_OF_SERVICE_STATES = ['Maintenance', 'Breakdown'];

export function serviceStatusLabel(value: unknown): string {
  return SERVICE_STATUS_OPTIONS.find((o) => o.value === value)?.name ?? String(value ?? '-');
}
