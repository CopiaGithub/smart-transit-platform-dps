import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel } from '../location-masters/location-lookups';
import {
  GATE_TYPE_OPTIONS,
  gateTypeLabel,
} from '../infrastructure-masters/infrastructure-lookups';

/**
 * E1 — Gate Master (WEB-APP-SCREENS.docx §Group E).
 *
 * At DPS Nerul: Gate 6 is the bus entry, Gate 1 is the bus exit, and there are
 * two student exits that the indoor displays serve.
 */
export const GATE_MASTER_CONFIG: MasterPageConfig = {
  title: 'Gate Master',
  singular: 'Gate',
  listTitle: 'Gate Master List',
  resource: 'GateMaster',
  // Newest first: a record you just added should be the first one you see.
  defaultSortBy: 'CreatedAt',
  defaultDescending: true,
  exportFileName: 'Gate_Master',

  entityLabel: (row) => row.GateName,

  columns: [
    { key: 'GateCode', label: 'Gate Code', width: '140px' },
    { key: 'GateName', label: 'Gate Name' },
    { key: 'GateTypeLabel', label: 'Type', width: '150px', type: 'badge' },
    { key: 'SortOrder', label: 'Sort Order', width: '130px' },
    { key: 'PlatformCount', label: 'Platforms', width: '120px' },
    { key: 'DisplayCount', label: 'Displays', width: '120px' },
    { key: 'Status', label: 'Status', width: '110px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    {
      name: 'gateType',
      label: 'Gate Type',
      type: 'dropdown',
      queryParam: 'gateType',
      optionsList: GATE_TYPE_OPTIONS,
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  fields: [
    { name: 'GateCode', label: 'Gate Code', type: 'text', required: true, maxLength: 20 },
    { name: 'GateName', label: 'Gate Name', type: 'text', required: true, maxLength: 100 },
    {
      name: 'GateType',
      label: 'Gate Type',
      type: 'dropdown',
      required: true,
      optionsList: GATE_TYPE_OPTIONS,
      value: 'BusEntry',
      hint: 'Student Exit gates are the doors children leave by.',
    },
    { name: 'SortOrder', label: 'Sort Order', type: 'number', value: 0 },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['GateCode', 'GateName'],

  toRow: (item) => ({
    id: item.Id,
    GateCode: item.GateCode,
    GateName: item.GateName,
    GateType: item.GateType,
    GateTypeLabel: gateTypeLabel(item.GateType),
    SortOrder: item.SortOrder,
    PlatformCount: item.PlatformCount ?? 0,
    DisplayCount: item.DisplayCount ?? 0,
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    GateCode: row.GateCode,
    GateName: row.GateName,
    GateType: row.GateType,
    SortOrder: row.SortOrder,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    GateCode: result.GateCode,
    GateName: result.GateName,
    GateType: result.GateType,
    SortOrder: Number(result.SortOrder) || 0,
  }),

  toUpdate: (result) => ({
    GateCode: result.GateCode,
    GateName: result.GateName,
    GateType: result.GateType,
    SortOrder: Number(result.SortOrder) || 0,
    IsActive: result.IsActive,
  }),
};
