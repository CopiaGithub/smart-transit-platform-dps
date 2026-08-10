import { MasterPageConfig } from '../master-page/master-page.types';
import {
  CITY_LOOKUP,
  COUNTRY_LOOKUP,
  IS_ACTIVE_FIELD,
  STATE_LOOKUP,
  activeLabel,
  toId,
} from '../location-masters/location-lookups';

/** A5 — PinCode Master. Cascade: Country -> State -> City. */
export const PINCODE_MASTER_CONFIG: MasterPageConfig = {
  title: 'PinCode Master',
  listTitle: 'PinCode Master List',
  resource: 'PinCodeMaster',
  defaultSortBy: 'PinCode',
  exportFileName: 'PinCode_Master',

  entityLabel: (row) => row.PinCode,

  columns: [
    { key: 'PinCode', label: 'PinCode', width: '160px' },
    { key: 'CityName', label: 'City' },
    { key: 'Status', label: 'Status', width: '120px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    {
      name: 'city',
      label: 'City',
      type: 'dropdown',
      queryParam: 'cityId',
      optionsFrom: 'city',
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  // The city filter is unscoped so a pincode can be found without first picking
  // a state; the dialog cascades properly.
  lookups: {
    country: COUNTRY_LOOKUP,
    state: STATE_LOOKUP,
    city: { ...CITY_LOOKUP, parentParam: undefined },
    cityByState: CITY_LOOKUP,
  },

  fields: [
    {
      name: 'PinCode',
      label: 'PinCode',
      type: 'text',
      required: true,
      maxLength: 20,
      pattern: /^[0-9]{6}$/,
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
      name: 'CityId',
      label: 'City',
      type: 'dropdown',
      required: true,
      optionsFrom: 'cityByState',
      dependsOn: 'StateId',
    },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['PinCode'],

  toRow: (item) => ({
    id: item.Id,
    PinCode: item.PinCode,
    CityName: item.CityName ?? '-',
    CityId: item.CityId,
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
  }),

  // PinCodeMasterListModel carries only CityId, so country and state start empty
  // on edit; choosing a country repopulates the chain.
  toFormData: (row) => ({
    PinCode: row.PinCode,
    CountryId: null,
    StateId: null,
    CityId: row.CityId,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    PinCode: result.PinCode,
    CityId: toId(result.CityId),
  }),

  toUpdate: (result) => ({
    PinCode: result.PinCode,
    CityId: toId(result.CityId),
    IsActive: result.IsActive,
  }),
};
