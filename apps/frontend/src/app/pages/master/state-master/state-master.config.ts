import { MasterPageConfig } from '../master-page/master-page.types';
import {
  COUNTRY_LOOKUP,
  IS_ACTIVE_FIELD,
  REGION_LOOKUP,
  activeLabel,
  toId,
} from '../location-masters/location-lookups';

/** A3 — State Master. Cascade: Country -> Region. */
export const STATE_MASTER_CONFIG: MasterPageConfig = {
  title: 'State Master',
  listTitle: 'State Master List',
  resource: 'StateMaster',
  defaultSortBy: 'StateName',
  exportFileName: 'State_Master',

  entityLabel: (row) => row.StateName,

  columns: [
    { key: 'StateCode', label: 'State Code', width: '150px' },
    { key: 'StateName', label: 'State Name' },
    { key: 'CountryName', label: 'Country' },
    { key: 'RegionName', label: 'Region' },
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
    {
      name: 'region',
      label: 'Region',
      type: 'dropdown',
      queryParam: 'regionId',
      optionsFrom: 'region',
      dependsOn: 'country',
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  lookups: { country: COUNTRY_LOOKUP, region: REGION_LOOKUP },

  fields: [
    { name: 'StateCode', label: 'State Code', type: 'text', maxLength: 20 },
    {
      name: 'StateName',
      label: 'State Name',
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
      name: 'RegionId',
      label: 'Region',
      type: 'dropdown',
      optionsFrom: 'region',
      dependsOn: 'CountryId',
    },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['StateName', 'StateCode'],

  toRow: (item) => ({
    id: item.Id,
    StateCode: item.StateCode ?? '-',
    StateName: item.StateName,
    CountryName: item.CountryName ?? '-',
    CountryId: item.CountryId,
    RegionName: item.RegionName ?? '-',
    RegionId: item.RegionId,
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    StateCode: row.StateCode === '-' ? '' : row.StateCode,
    StateName: row.StateName,
    CountryId: row.CountryId,
    RegionId: row.RegionId,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    StateCode: result.StateCode || null,
    StateName: result.StateName,
    CountryId: toId(result.CountryId),
    RegionId: toId(result.RegionId),
  }),

  toUpdate: (result) => ({
    StateCode: result.StateCode || null,
    StateName: result.StateName,
    CountryId: toId(result.CountryId),
    RegionId: toId(result.RegionId),
    IsActive: result.IsActive,
  }),
};
