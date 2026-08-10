import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel } from '../location-masters/location-lookups';

/**
 * B1 — Role Master (WEB-APP-SCREENS.docx §Group B).
 *
 * The exact role names in role_master are Admin, Teacher, Parent,
 * Gate 6 Operator and Gate 1 Operator. A guard's post is part of the role name:
 * the apps find "Gate 6" inside "Gate 6 Operator" to know which gate it is, so
 * renaming a role breaks that mapping. Hence the warning before a rename.
 */
export const ROLE_MASTER_CONFIG: MasterPageConfig = {
  title: 'Role Master',
  singular: 'Role',
  listTitle: 'Role Master List',
  resource: 'RoleMaster',
  defaultSortBy: 'RoleName',
  exportFileName: 'Role_Master',

  entityLabel: (row) => row.RoleName,

  columns: [
    { key: 'RoleName', label: 'Role Name', width: '220px' },
    { key: 'Description', label: 'Description' },
    { key: 'Status', label: 'Status', width: '120px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  fields: [
    {
      name: 'RoleName',
      label: 'Role Name',
      type: 'text',
      required: true,
      maxLength: 50,
      hint: 'A gate operator\'s post is part of the name — e.g. "Gate 6 Operator".',
    },
    { name: 'Description', label: 'Description', type: 'textarea', maxLength: 200 },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['RoleName'],

  confirmBeforeSave: (_result, mode) =>
    mode === 'edit'
      ? 'Renaming a role can break how the apps map users to screens — the gate ' +
        'consoles match on the words "Gate 6" and "Gate 1" inside the role name. Continue?'
      : null,

  toRow: (item) => ({
    id: item.Id,
    RoleName: item.RoleName,
    Description: item.Description ?? '-',
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    RoleName: row.RoleName,
    Description: row.Description === '-' ? '' : row.Description,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    RoleName: result.RoleName,
    Description: result.Description || null,
  }),

  toUpdate: (result) => ({
    RoleName: result.RoleName,
    Description: result.Description || null,
    IsActive: result.IsActive,
  }),
};
