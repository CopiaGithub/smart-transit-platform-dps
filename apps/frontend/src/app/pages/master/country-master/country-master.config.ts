import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel } from '../location-masters/location-lookups';

/**
 * A1 — Country Master (WEB-APP-SCREENS.docx §Group A).
 *
 * CountryMasterController exposes GET only today; POST/PATCH/DELETE are on the
 * way. The UI is built as full CRUD as specified, so nothing needs rewriting
 * when they land — until then a write surfaces the server's own refusal.
 */
export const COUNTRY_MASTER_CONFIG: MasterPageConfig = {
  title: 'Country Master',
  listTitle: 'Country Master List',
  resource: 'CountryMaster',
  defaultSortBy: 'CountryName',
  exportFileName: 'Country_Master',

  entityLabel: (row) => row.CountryName,

  columns: [
    { key: 'CountryCode', label: 'Country Code', width: '160px' },
    { key: 'CountryName', label: 'Country Name' },
    { key: 'Status', label: 'Status', width: '120px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  fields: [
    { name: 'CountryCode', label: 'Country Code', type: 'text', maxLength: 20 },
    {
      name: 'CountryName',
      label: 'Country Name',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['CountryName', 'CountryCode'],

  toRow: (item) => ({
    id: item.Id,
    CountryCode: item.CountryCode ?? '-',
    CountryName: item.CountryName,
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    CountryCode: row.CountryCode === '-' ? '' : row.CountryCode,
    CountryName: row.CountryName,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    CountryCode: result.CountryCode || null,
    CountryName: result.CountryName,
  }),

  toUpdate: (result) => ({
    CountryCode: result.CountryCode || null,
    CountryName: result.CountryName,
    IsActive: result.IsActive,
  }),
};
