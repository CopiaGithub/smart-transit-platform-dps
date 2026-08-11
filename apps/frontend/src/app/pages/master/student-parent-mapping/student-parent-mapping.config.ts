import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel, toId } from '../location-masters/location-lookups';
import {
  PARENT_LOOKUP,
  RELATION_OPTIONS,
  STUDENT_LOOKUP,
} from '../people-masters/people-lookups';

/**
 * C4 — Student-Parent Mapping (WEB-APP-SCREENS.docx §Group C).
 *
 * A many-to-many link that carries its own data: the same father can be the
 * primary contact for one child and only an emergency contact for another.
 *
 * IsAuthorisedForPickup is not the same as ReceivesNotifications — a parent may
 * be kept informed but not allowed to collect the child.
 *
 * StudentParentMappingUpdateModel has no StudentId or ParentId, so the server
 * does not allow re-pointing an existing link. Both are locked once created;
 * delete and re-create instead.
 */
export const STUDENT_PARENT_MAPPING_CONFIG: MasterPageConfig = {
  title: 'Student-Parent Mapping',
  singular: 'Mapping',
  listTitle: 'Student-Parent Mapping List',
  resource: 'StudentParentMapping',
  defaultSortBy: 'StudentName',
  exportFileName: 'Student_Parent_Mapping',

  entityLabel: (row) => `${row.ParentName} → ${row.StudentName}`,

  columns: [
    { key: 'StudentName', label: 'Student' },
    { key: 'AdmissionNumber', label: 'Admission No', width: '150px' },
    { key: 'Class', label: 'Class', width: '110px' },
    { key: 'ParentName', label: 'Parent' },
    { key: 'MobileNumber', label: 'Mobile', width: '140px' },
    { key: 'Relation', label: 'Relation', width: '130px' },
    { key: 'Flags', label: 'Roles' },
    { key: 'ContactPriority', label: 'Priority', width: '110px' },
    { key: 'Status', label: 'Status', width: '110px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    {
      name: 'student',
      label: 'Student',
      type: 'dropdown',
      queryParam: 'studentId',
      optionsFrom: 'student',
    },
    {
      name: 'parent',
      label: 'Parent',
      type: 'dropdown',
      queryParam: 'parentId',
      optionsFrom: 'parent',
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  lookups: { student: STUDENT_LOOKUP, parent: PARENT_LOOKUP },

  fields: [
    {
      name: 'StudentId',
      label: 'Student',
      type: 'dropdown',
      required: true,
      optionsFrom: 'student',
      readonlyOnEdit: true,
    },
    {
      name: 'ParentId',
      label: 'Parent',
      type: 'dropdown',
      required: true,
      optionsFrom: 'parent',
      readonlyOnEdit: true,
    },
    {
      name: 'Relation',
      label: 'Relation',
      type: 'dropdown',
      required: true,
      optionsList: RELATION_OPTIONS,
    },
    { name: 'IsPrimaryContact', label: 'Primary Contact', type: 'toggle' },
    { name: 'IsEmergencyContact', label: 'Emergency Contact', type: 'toggle' },
    {
      name: 'IsAuthorisedForPickup',
      label: 'Authorised for Pickup',
      type: 'toggle',
      value: true,
      hint: 'Different from notifications — being informed is not permission to collect.',
    },
    {
      name: 'ReceivesNotifications',
      label: 'Receives Notifications',
      type: 'toggle',
      value: true,
    },
    {
      name: 'ContactPriority',
      label: 'Contact Priority',
      type: 'number',
      value: 1,
      hint: 'Who to call first. 1 is highest.',
    },
    IS_ACTIVE_FIELD,
  ],

  // A student and parent may only be linked once — the server owns that rule.
  duplicateCheckFields: [],

  toRow: (item) => ({
    id: item.Id,
    StudentId: item.StudentId,
    StudentName: item.StudentName,
    AdmissionNumber: item.AdmissionNumber,
    Class: item.Class,
    ParentId: item.ParentId,
    ParentName: item.ParentName,
    MobileNumber: item.MobileNumber,
    Relation: item.Relation,
    Flags: describeFlags(item),
    ContactPriority: item.ContactPriority,
    Status: activeLabel(item.IsActive),
    IsPrimaryContact: item.IsPrimaryContact,
    IsEmergencyContact: item.IsEmergencyContact,
    IsAuthorisedForPickup: item.IsAuthorisedForPickup,
    ReceivesNotifications: item.ReceivesNotifications,
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    StudentId: row.StudentId,
    ParentId: row.ParentId,
    Relation: row.Relation,
    IsPrimaryContact: row.IsPrimaryContact,
    IsEmergencyContact: row.IsEmergencyContact,
    IsAuthorisedForPickup: row.IsAuthorisedForPickup,
    ReceivesNotifications: row.ReceivesNotifications,
    ContactPriority: row.ContactPriority,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    StudentId: toId(result.StudentId),
    ParentId: toId(result.ParentId),
    ...mappingFlags(result),
  }),

  // StudentId and ParentId are omitted — the server's update model has no such
  // fields, so an existing link cannot be re-pointed.
  toUpdate: (result) => ({
    ...mappingFlags(result),
    IsActive: result.IsActive,
  }),
};

function mappingFlags(result: any): Record<string, unknown> {
  return {
    Relation: result.Relation,
    IsPrimaryContact: !!result.IsPrimaryContact,
    IsEmergencyContact: !!result.IsEmergencyContact,
    IsAuthorisedForPickup: !!result.IsAuthorisedForPickup,
    ReceivesNotifications: !!result.ReceivesNotifications,
    ContactPriority: toId(result.ContactPriority) ?? 1,
  };
}

/** Compresses the four booleans into one readable column. */
function describeFlags(item: any): string {
  const flags: string[] = [];
  if (item.IsPrimaryContact) flags.push('Primary');
  if (item.IsEmergencyContact) flags.push('Emergency');
  if (item.IsAuthorisedForPickup) flags.push('Pickup');
  if (item.ReceivesNotifications) flags.push('Notified');
  return flags.length ? flags.join(' · ') : '-';
}
