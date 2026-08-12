import { MasterPageConfig } from '../master-page/master-page.types';
import {
  COUNTRY_LOOKUP,
  IS_ACTIVE_FIELD,
  REGION_LOOKUP,
  STATE_LOOKUP,
  activeLabel,
  toId,
} from '../location-masters/location-lookups';

/**
 * A4 — City Master.
 *
 * CityMasterController filters by stateId and regionId. State options cascade
 * off a country picker that is itself not sent to the server — it exists only
 * to narrow the state list.
 */
export const CITY_MASTER_CONFIG: MasterPageConfig = {
  // Location data is reference data — the Country -> Region -> State -> City ->
  // PinCode chain every other master points at. It is seeded, not maintained
  // here: editing a row would silently re-point live records, so this screen
  // is browse-and-view only (hides Add/Edit/Delete).
  readOnly: true,
  title: 'City Master',
  listTitle: 'City Master List',
  resource: 'CityMaster',
  defaultSortBy: 'CityName',
  exportFileName: 'City_Master',

  entityLabel: (row) => row.CityName,

  columns: [
    { key: 'CityCode', label: 'City Code', width: '150px' },
    { key: 'CityName', label: 'City Name' },
    { key: 'StateName', label: 'State' },
    { key: 'RegionName', label: 'Region' },
    { key: 'CountryName', label: 'Country' },
    { key: 'Status', label: 'Status', width: '120px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    {
      name: 'state',
      label: 'State',
      type: 'dropdown',
      queryParam: 'stateId',
      optionsFrom: 'stateAll',
    },
    {
      name: 'region',
      label: 'Region',
      type: 'dropdown',
      queryParam: 'regionId',
      optionsFrom: 'regionAll',
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  // The filters are unscoped, the dialog cascades. STATE_LOOKUP and REGION_LOOKUP
  // both declare parentParam 'countryId', and LookupService returns an empty list
  // for a parented lookup with no parent — so the filter dropdowns, which have no
  // country to cascade from, came back permanently empty. Same fix PinCode Master
  // already uses for its city filter.
  lookups: {
    country: COUNTRY_LOOKUP,
    region: REGION_LOOKUP,
    state: STATE_LOOKUP,
    stateAll: { ...STATE_LOOKUP, parentParam: undefined },
    regionAll: { ...REGION_LOOKUP, parentParam: undefined },
  },

  fields: [
    { name: 'CityCode', label: 'City Code', type: 'text', maxLength: 20 },
    {
      name: 'CityName',
      label: 'City Name',
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
    {
      name: 'StateId',
      label: 'State',
      type: 'dropdown',
      required: true,
      optionsFrom: 'state',
      dependsOn: 'CountryId',
    },
    {
      name: 'RegionId',
      label: 'Region',
      type: 'dropdown',
      optionsFrom: 'region',
      dependsOn: 'CountryId',
    },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['CityName', 'CityCode'],

  toRow: (item) => ({
    id: item.Id,
    CityCode: item.CityCode ?? '-',
    CityName: item.CityName,
    StateName: item.StateName ?? '-',
    StateId: item.StateId,
    RegionName: item.RegionName ?? '-',
    RegionId: item.RegionId,
    CountryName: item.CountryName ?? '-',
    CountryId: item.CountryId,
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
  }),

  // CountryId comes from the list model now (resolved through the state), so the
  // dialog can scope its State and Region options and show what the record holds
  // instead of two blank boxes.
  toFormData: (row) => ({
    CityCode: row.CityCode === '-' ? '' : row.CityCode,
    CityName: row.CityName,
    CountryId: row.CountryId,
    StateId: row.StateId,
    RegionId: row.RegionId,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    CityCode: result.CityCode || null,
    CityName: result.CityName,
    StateId: toId(result.StateId),
    RegionId: toId(result.RegionId),
  }),

  toUpdate: (result) => ({
    CityCode: result.CityCode || null,
    CityName: result.CityName,
    StateId: toId(result.StateId),
    RegionId: toId(result.RegionId),
    IsActive: result.IsActive,
  }),
};
