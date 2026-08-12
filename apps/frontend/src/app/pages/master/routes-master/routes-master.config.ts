import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel } from '../location-masters/location-lookups';

/**
 * D1 — Routes Master (WEB-APP-SCREENS.docx §Group D).
 *
 * LedDisplayName is the short, usually uppercase name shown on the LED panel.
 * When it is empty the LED renderer falls back to RouteName — so it is optional
 * here, not required.
 */
export const ROUTES_MASTER_CONFIG: MasterPageConfig = {
  title: 'Routes Master',
  singular: 'Route',
  listTitle: 'Routes Master List',
  resource: 'RoutesMaster',
  // Newest first: after adding a route you should land on it, not scroll for it.
  defaultSortBy: 'CreatedAt',
  defaultDescending: true,
  exportFileName: 'Routes_Master',

  entityLabel: (row) => row.RouteName,

  columns: [
    { key: 'RouteCode', label: 'Route Code', width: '160px' },
    { key: 'RouteName', label: 'Route Name' },
    { key: 'LedDisplayName', label: 'LED Display Name' },
    { key: 'Status', label: 'Status', width: '120px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  fields: [
    {
      name: 'RouteCode',
      label: 'Route Code',
      type: 'text',
      required: true,
      maxLength: 50,
    },
    {
      name: 'RouteName',
      label: 'Route Name',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    {
      name: 'LedDisplayName',
      label: 'LED Display Name',
      type: 'text',
      maxLength: 100,
    },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['RouteName', 'RouteCode'],

  toRow: (item) => ({
    id: item.Id,
    RouteCode: item.RouteCode ?? '-',
    RouteName: item.RouteName,
    // Show the fallback the LED panel would actually use.
    LedDisplayName: item.LedDisplayName || item.RouteName,
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
    RawLedDisplayName: item.LedDisplayName ?? '',
  }),

  toFormData: (row) => ({
    RouteCode: row.RouteCode === '-' ? '' : row.RouteCode,
    RouteName: row.RouteName,
    LedDisplayName: row.RawLedDisplayName,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    RouteCode: result.RouteCode || null,
    RouteName: result.RouteName,
    LedDisplayName: result.LedDisplayName || null,
  }),

  toUpdate: (result) => ({
    RouteCode: result.RouteCode || null,
    RouteName: result.RouteName,
    LedDisplayName: result.LedDisplayName || null,
    IsActive: result.IsActive,
  }),
};
