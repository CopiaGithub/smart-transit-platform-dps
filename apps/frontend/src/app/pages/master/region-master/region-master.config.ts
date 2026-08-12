import { MasterPageConfig } from '../master-page/master-page.types';
import {
  COUNTRY_LOOKUP,
  IS_ACTIVE_FIELD,
  activeLabel,
  toId,
} from '../location-masters/location-lookups';

/** A2 — Region Master. Cascade parent: Country. */
export const REGION_MASTER_CONFIG: MasterPageConfig = {
  // Location data is reference data — the Country -> Region -> State -> City ->
  // PinCode chain every other master points at. It is seeded, not maintained
  // here: editing a row would silently re-point live records, so this screen
  // is browse-and-view only (hides Add/Edit/Delete).
  readOnly: true,
  title: 'Region Master',
  listTitle: 'Region Master List',
  resource: 'RegionMaster',
  defaultSortBy: 'RegionName',
  exportFileName: 'Region_Master',

  entityLabel: (row) => row.RegionName,

  columns: [
    { key: 'RegionCode', label: 'Region Code', width: '160px' },
    { key: 'RegionName', label: 'Region Name' },
    { key: 'CountryName', label: 'Country' },
    { key: 'Status', label: 'Status', width: '120px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    {
      name: 'country',
      label: 'Country',
      type: 'dropdown',
      queryParam: 'countryId',
      optionsFrom: 'country',
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  lookups: { country: COUNTRY_LOOKUP },

  fields: [
    { name: 'RegionCode', label: 'Region Code', type: 'text', maxLength: 20 },
    {
      name: 'RegionName',
      label: 'Region Name',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    {
      name: 'CountryId',
      label: 'Country',
      type: 'dropdown',
      required: true,
      optionsFrom: 'country',
    },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['RegionName', 'RegionCode'],

  toRow: (item) => ({
    id: item.Id,
    RegionCode: item.RegionCode ?? '-',
    RegionName: item.RegionName,
    CountryName: item.CountryName ?? '-',
    CountryId: item.CountryId,
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    RegionCode: row.RegionCode === '-' ? '' : row.RegionCode,
    RegionName: row.RegionName,
    CountryId: row.CountryId,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    RegionCode: result.RegionCode || null,
    RegionName: result.RegionName,
    CountryId: toId(result.CountryId),
  }),

  toUpdate: (result) => ({
    RegionCode: result.RegionCode || null,
    RegionName: result.RegionName,
    CountryId: toId(result.CountryId),
    IsActive: result.IsActive,
  }),
};
