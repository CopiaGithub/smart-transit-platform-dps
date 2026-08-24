import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel } from '../location-masters/location-lookups';
import { PLATFORM_SIDE_OPTIONS } from '../infrastructure-masters/infrastructure-lookups';

/**
 * E2 — Platforms Master (WEB-APP-SCREENS.docx §Group E).
 *
 * Platforms are numbered 1 to 23 in the U-shaped compound. `Side` says which arm
 * of the U a platform sits on — it cannot be worked out from the number, which is
 * why it is stored explicitly.
 *
 * The docx also specifies a NearestGateId ("which door do I walk out of?").
 * PlatformsMaster.NearestGateId EXISTS on the entity and has a foreign key to
 * GateMaster, but it is absent from PlatformsMasterCreateModel,
 * PlatformsMasterUpdateModel and PlatformsMasterListModel — so the API can
 * neither return nor set it. The field is left off this screen until those DTOs
 * carry it; adding it here would silently drop the value on save.
 */
export const PLATFORMS_MASTER_CONFIG: MasterPageConfig = {
  title: 'Platforms Master',
  singular: 'Platform',
  listTitle: 'Platforms Master List',
  resource: 'PlatformsMaster',
  // Newest first: a record you just added should be the first one you see.
  defaultSortBy: 'CreatedAt',
  defaultDescending: true,
  exportFileName: 'Platforms_Master',

  entityLabel: (row) => `Platform ${row.PlatformNumber}`,

  columns: [
    { key: 'PlatformNumber', label: 'Platform Number', width: '170px' },
    { key: 'PlatformName', label: 'Name' },
    { key: 'Side', label: 'Side', width: '130px' },
    { key: 'SortOrder', label: 'Sort Order', width: '130px' },
    { key: 'Status', label: 'Status', width: '110px', type: 'badge' },
  ],

  // PlatformsMasterController takes only the standard pagination filter + status.
  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  fields: [
    {
      name: 'PlatformNumber',
      label: 'Platform Number',
      type: 'number',
      required: true,
      hint: 'The fixed number painted in the compound — 1 to 23.',
    },
    { name: 'PlatformName', label: 'Platform Name', type: 'text', maxLength: 50 },
    {
      name: 'Side',
      label: 'Side',
      type: 'dropdown',
      optionsList: PLATFORM_SIDE_OPTIONS,
      hint: 'Which arm of the U-shaped compound this platform is on.',
    },
    { name: 'SortOrder', label: 'Sort Order', type: 'number', value: 0 },
    IS_ACTIVE_FIELD,
  ],

  // SortOrder is checked here as well as on the server. This check only sees
  // the page of rows currently loaded — the list is paginated server-side —
  // so it catches the everyday case early; the service is what actually
  // guarantees uniqueness.
  duplicateCheckFields: ['PlatformNumber', 'SortOrder'],

  // Deactivating a platform takes it out of allocation, which shrinks how many
  // buses the yard can hold at once.
  confirmBeforeSave: (result, mode) =>
    mode === 'edit' && result.IsActive === false
      ? 'Deactivating this platform removes it from allocation and reduces the ' +
        'yard\'s capacity, so more buses will end up Waiting. Continue?'
      : null,

  toRow: (item) => ({
    id: item.Id,
    PlatformNumber: item.PlatformNumber,
    PlatformName: item.PlatformName ?? '-',
    Side: item.Side ?? '-',
    SortOrder: item.SortOrder,
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    PlatformNumber: row.PlatformNumber,
    PlatformName: row.PlatformName === '-' ? '' : row.PlatformName,
    Side: row.Side === '-' ? '' : row.Side,
    SortOrder: row.SortOrder,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    PlatformNumber: Number(result.PlatformNumber),
    PlatformName: result.PlatformName || null,
    Side: result.Side || null,
    SortOrder: Number(result.SortOrder) || 0,
  }),

  toUpdate: (result) => ({
    PlatformNumber: Number(result.PlatformNumber),
    PlatformName: result.PlatformName || null,
    Side: result.Side || null,
    SortOrder: Number(result.SortOrder) || 0,
    IsActive: result.IsActive,
  }),
};
