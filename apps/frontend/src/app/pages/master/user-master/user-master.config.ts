import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel, toId } from '../location-masters/location-lookups';
import { ROLE_LOOKUP } from '../security-masters/security-lookups';

/**
 * B2 — User Master / Staff (WEB-APP-SCREENS.docx §Group B).
 *
 * School staff only: admins, teachers and gate operators. Parents are NOT here —
 * they live in Parent Master, and only get a UserMaster row once they register
 * for the parent app.
 *
 * Any of email, employee code or contact number can be used to log in — the
 * server checks all three with an OR.
 *
 * The docx also asks to show LastLoginAt, FailedLoginAttempts, LockoutEndsAt,
 * MustChangePassword and PasswordUpdatedAt read-only. UserMasterListModel does
 * not return them today, so they are omitted rather than shown as blanks.
 */
export const USER_MASTER_CONFIG: MasterPageConfig = {
  title: 'User Master',
  singular: 'User',
  listTitle: 'Staff List',
  resource: 'UserMaster',
  defaultSortBy: 'Name',
  exportFileName: 'User_Master',

  entityLabel: (row) => row.Name,

  columns: [
    { key: 'Name', label: 'Name' },
    { key: 'EmployeeCode', label: 'Employee Code', width: '160px' },
    { key: 'EmailId', label: 'Email' },
    { key: 'Contact', label: 'Contact', width: '150px' },
    { key: 'RoleName', label: 'Role', width: '170px' },
    { key: 'Status', label: 'Status', width: '110px', type: 'badge' },
  ],

  filters: [
    {
      name: 'search',
      label: 'Search',
      type: 'search',
      queryParam: 'SearchTerm',
      placeholder: 'Name, email or employee code',
    },
    {
      name: 'role',
      label: 'Role',
      type: 'dropdown',
      queryParam: 'roleId',
      optionsFrom: 'role',
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  lookups: { role: ROLE_LOOKUP },

  fields: [
    { name: 'Name', label: 'Name', type: 'text', required: true, maxLength: 100 },
    {
      name: 'EmployeeCode',
      label: 'Employee Code',
      type: 'text',
      maxLength: 50,
      hint: 'Unique. Can be used to log in.',
    },
    {
      name: 'EmailId',
      label: 'Email',
      type: 'email',
      maxLength: 100,
      hint: 'Can be used to log in.',
    },
    {
      name: 'Contact',
      label: 'Contact',
      type: 'text',
      maxLength: 20,
      hint: 'Can be used to log in.',
    },
    {
      name: 'Password',
      label: 'Password',
      type: 'password',
      // Required when creating; on edit, blank means "keep the current one".
      requiredOnCreate: true,
      hint: 'Leave blank to keep the current password.',
    },
    { name: 'RoleId', label: 'Role', type: 'dropdown', required: true, optionsFrom: 'role' },
    { name: 'Address', label: 'Address', type: 'textarea', maxLength: 250 },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['EmployeeCode', 'EmailId'],

  toRow: (item) => ({
    id: item.Id,
    Name: item.Name,
    EmployeeCode: item.EmployeeCode ?? '-',
    EmailId: item.EmailId ?? '-',
    Contact: item.Contact ?? '-',
    RoleId: item.RoleId,
    RoleName: item.RoleName ?? '-',
    Address: item.Address ?? '',
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    Name: row.Name,
    EmployeeCode: dash(row.EmployeeCode),
    EmailId: dash(row.EmailId),
    Contact: dash(row.Contact),
    // Never round-trips a password hash into the form.
    Password: '',
    RoleId: row.RoleId,
    Address: row.Address,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    Name: result.Name,
    EmployeeCode: result.EmployeeCode || null,
    EmailId: result.EmailId || null,
    Contact: result.Contact || null,
    Password: result.Password,
    RoleId: toId(result.RoleId),
    Address: result.Address || null,
  }),

  // Password is omitted entirely when left blank, so the server keeps the
  // existing BCrypt hash instead of overwriting it with an empty string.
  toUpdate: (result) => {
    const body: Record<string, unknown> = {
      Name: result.Name,
      EmployeeCode: result.EmployeeCode || null,
      EmailId: result.EmailId || null,
      Contact: result.Contact || null,
      RoleId: toId(result.RoleId),
      Address: result.Address || null,
      IsActive: result.IsActive,
    };
    if (result.Password) {
      body['Password'] = result.Password;
    }
    return body;
  },
};

function dash(value: unknown): string {
  return value === '-' || value == null ? '' : String(value);
}
