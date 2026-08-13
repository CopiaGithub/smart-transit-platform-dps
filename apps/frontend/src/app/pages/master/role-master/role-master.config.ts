import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel } from '../location-masters/location-lookups';

/**
 * B1 — Role Master (WEB-APP-SCREENS.docx §Group B).
 *
 * The exact role names in role_master are Admin, Teacher, Parent,
 * Gate 6 Operator and Gate 1 Operator, and those five strings are matched all
 * over both apps: 31 endpoints authorise on them through RoleNames, the sidebar
 * decides what to show from them, and a guard's post is read out of the name
 * ("Gate 6" inside "Gate 6 Operator").
 *
 * So renaming one is not a rename, it is a lockout — every holder loses the
 * endpoints their old name unlocked. The server refuses it outright rather than
 * asking the user to confirm something they cannot undo; this screen only has to
 * say so up front, which the Role Name hint does.
 */
export const ROLE_MASTER_CONFIG: MasterPageConfig = {
  title: 'Role Master',
  singular: 'Role',
  listTitle: 'Role Master List',
  resource: 'RoleMaster',
  // Newest first: a record you just added should be the first one you see.
  defaultSortBy: 'CreatedAt',
  defaultDescending: true,
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
      hint:
        'A gate operator\'s post is part of the name — e.g. "Gate 6 Operator". ' +
        'The five built-in roles cannot be renamed: permissions are matched on ' +
        'the exact name.',
    },
    { name: 'Description', label: 'Description', type: 'textarea', maxLength: 200 },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['RoleName'],

  // No prompt at all on an ordinary edit. This used to warn about renaming on
  // every save, including the ones that only touched the description or the
  // status — a warning that fires when it does not apply is one people learn to
  // click through, which is worse than no warning.
  //
  // The rename itself is no longer a "continue anyway?" decision: the server
  // refuses to rename a built-in role outright, because 31 endpoints authorise
  // on the literal name and renaming one locks out everybody who holds it. That
  // refusal arrives as the server's own message, which says what to do instead.
  confirmBeforeSave: () => null,

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
