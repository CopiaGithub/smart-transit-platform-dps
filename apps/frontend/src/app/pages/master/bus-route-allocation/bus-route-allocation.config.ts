import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel, toId } from '../location-masters/location-lookups';
import {
  ALLOCATION_TYPE_OPTIONS,
  BUS_LOOKUP,
  ROUTE_LOOKUP,
} from '../transport-masters/transport-lookups';

/**
 * D3 — Bus-Route Allocation (WEB-APP-SCREENS.docx §Group D).
 *
 * Answers "who runs Vashi tomorrow?" before a dispersal has started.
 *
 *  - Standing  = the permanent bus/route pairing, open-ended (EffectiveTo null).
 *  - Override  = covers a single date and beats the standing row for that date.
 *                For an Override the server treats EffectiveTo as equal to
 *                EffectiveFrom, which is how a last-minute reserve substitution
 *                is recorded without disturbing the permanent allocation.
 *
 * Two extras from the docx are deliberately NOT on this screen, because neither
 * is a list-and-form and both need their own UI:
 *   - the "for a date" view  (GET /api/BusRouteAllocation/for-date?date=)
 *   - the "substitute" one-click action (POST /api/BusRouteAllocation/substitute)
 * Both endpoints exist and are ready to bind.
 */
export const BUS_ROUTE_ALLOCATION_CONFIG: MasterPageConfig = {
  title: 'Bus-Route Allocation',
  singular: 'Allocation',
  listTitle: 'Bus-Route Allocation List',
  resource: 'BusRouteAllocation',
  defaultSortBy: 'EffectiveFrom',
  exportFileName: 'Bus_Route_Allocation',

  entityLabel: (row) => `${row.BusNumber} on ${row.RouteName}`,

  columns: [
    { key: 'RouteName', label: 'Route' },
    { key: 'BusNumber', label: 'Bus', width: '120px' },
    { key: 'AllocationType', label: 'Type', width: '120px', type: 'badge' },
    { key: 'EffectiveFrom', label: 'From', width: '130px' },
    { key: 'EffectiveTo', label: 'To', width: '130px' },
    { key: 'Reason', label: 'Reason' },
    { key: 'Status', label: 'Status', width: '110px', type: 'badge' },
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
    {
      name: 'bus',
      label: 'Bus',
      type: 'dropdown',
      queryParam: 'busId',
      optionsFrom: 'bus',
    },
    {
      name: 'allocationType',
      label: 'Allocation Type',
      type: 'dropdown',
      queryParam: 'allocationType',
      optionsList: ALLOCATION_TYPE_OPTIONS,
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  lookups: { route: ROUTE_LOOKUP, bus: BUS_LOOKUP },

  fields: [
    {
      name: 'RouteId',
      label: 'Route',
      type: 'dropdown',
      required: true,
      optionsFrom: 'route',
    },
    {
      name: 'BusId',
      label: 'Bus',
      type: 'dropdown',
      required: true,
      optionsFrom: 'bus',
    },
    {
      name: 'AllocationType',
      label: 'Allocation Type',
      type: 'dropdown',
      required: true,
      optionsList: ALLOCATION_TYPE_OPTIONS,
      value: 'Standing',
    },
    { name: 'EffectiveFrom', label: 'Effective From', type: 'date', required: true },
    {
      name: 'EffectiveTo',
      label: 'Effective To',
      type: 'date',
      // A Standing row is open-ended, so it has no end date to ask for.
      visibleWhen: { field: 'AllocationType', equals: 'Override' },
    },
    { name: 'Reason', label: 'Reason', type: 'text', maxLength: 200 },
    IS_ACTIVE_FIELD,
  ],

  toRow: (item) => ({
    id: item.Id,
    RouteId: item.RouteId,
    RouteName: item.RouteName ?? '-',
    BusId: item.BusId,
    BusNumber: item.BusNumber ?? '-',
    AllocationType: item.AllocationType,
    EffectiveFrom: formatDate(item.EffectiveFrom),
    EffectiveTo: item.EffectiveTo ? formatDate(item.EffectiveTo) : 'Open-ended',
    Reason: item.Reason ?? '-',
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
    RawEffectiveFrom: item.EffectiveFrom ?? '',
    RawEffectiveTo: item.EffectiveTo ?? '',
  }),

  toFormData: (row) => ({
    RouteId: row.RouteId,
    BusId: row.BusId,
    AllocationType: row.AllocationType,
    EffectiveFrom: row.RawEffectiveFrom,
    EffectiveTo: row.RawEffectiveTo,
    Reason: row.Reason === '-' ? '' : row.Reason,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    RouteId: toId(result.RouteId),
    BusId: toId(result.BusId),
    AllocationType: result.AllocationType,
    EffectiveFrom: result.EffectiveFrom,
    EffectiveTo: effectiveTo(result),
    Reason: result.Reason || null,
  }),

  // AllocationType is absent from BusRouteAllocationUpdateModel — the server does
  // not let a Standing row become an Override, so it is not sent on PATCH.
  toUpdate: (result) => ({
    RouteId: toId(result.RouteId),
    BusId: toId(result.BusId),
    EffectiveFrom: result.EffectiveFrom,
    EffectiveTo: effectiveTo(result),
    Reason: result.Reason || null,
    IsActive: result.IsActive,
  }),
};

/** Standing is open-ended; an Override covers exactly its own date. */
function effectiveTo(result: any): string | null {
  if (result.AllocationType === 'Override') {
    return result.EffectiveTo || result.EffectiveFrom || null;
  }
  return null;
}

/** DateOnly arrives as 'YYYY-MM-DD'; show it the way the school writes dates. */
function formatDate(value: unknown): string {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
