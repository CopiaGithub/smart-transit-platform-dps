import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel, toId } from '../location-masters/location-lookups';
import { BUS_LOOKUP, ROUTE_LOOKUP } from '../transport-masters/transport-lookups';
import { USER_LOOKUP } from '../security-masters/security-lookups';
import { PARENT_LOOKUP, RELATION_OPTIONS } from '../people-masters/people-lookups';
import { LookupConfig } from '../../../core/api/lookup.service';

const ACADEMIC_YEAR_LOOKUP: LookupConfig = {
  resource: 'AcademicYearMaster',
  labelField: 'YearName',
};

/** Student exit gates are the doors children leave by; bus gates are not offered. */
const EXIT_GATE_LOOKUP: LookupConfig = {
  resource: 'GateMaster',
  labelField: 'GateName',
  codeField: 'GateCode',
  extraParams: { gateType: 'StudentExit' },
};

const BASIC = 'Basic';
const TRANSPORT = 'Transport';
const PARENTS = 'Parents';

/**
 * C2 — Student Master (WEB-APP-SCREENS.docx §Group C). The biggest form, split
 * into the two tabs the spec asks for.
 *
 * Grade is text, not a number — it covers Nursery, Jr KG and Sr KG as well as
 * 1 to 12.
 *
 * The form asks for a Route, never a Bus. An admin knows the child's address and
 * therefore the route; which vehicle serves it belongs to Bus Route Allocation and
 * changes whenever a reserve substitutes. The Bus column in the list is resolved
 * server-side from the route, so a substitution moves every rider at once.
 */
export const STUDENT_MASTER_CONFIG: MasterPageConfig = {
  title: 'Student Master',
  singular: 'Student',
  listTitle: 'Student List',
  resource: 'StudentMaster',
  defaultSortBy: 'FirstName',
  exportFileName: 'Student_Master',

  entityLabel: (row) => `${row.Name} (${row.AdmissionNumber})`,

  columns: [
    { key: 'AdmissionNumber', label: 'Admission No', width: '150px' },
    { key: 'Name', label: 'Name' },
    { key: 'Class', label: 'Grade-Div', width: '120px' },
    // Class teacher is held per student, not per class, so sorting by Grade-Div is
    // the only way to read teacher-per-class off this grid — and two rows in the
    // same class can legitimately disagree. See the note on the config below.
    { key: 'ClassTeacherName', label: 'Class Teacher' },
    { key: 'BusNumber', label: 'Bus', width: '100px' },
    { key: 'RouteName', label: 'Route' },
    { key: 'ExitGateName', label: 'Exit Gate' },
    { key: 'PrimaryContact', label: 'Primary Contact' },
    { key: 'Status', label: 'Status', width: '110px', type: 'badge' },
  ],

  // The controller accepts academicYearId, grade, division, busId, exitGateId,
  // classTeacherId and status. It has no routeId filter, so one is not offered.
  filters: [
    {
      name: 'search',
      label: 'Search',
      type: 'search',
      queryParam: 'SearchTerm',
      placeholder: 'Name or admission number',
    },
    {
      name: 'academicYear',
      label: 'Academic Year',
      type: 'dropdown',
      queryParam: 'academicYearId',
      optionsFrom: 'academicYear',
    },
    {
      name: 'classTeacher',
      label: 'Class Teacher',
      type: 'dropdown',
      queryParam: 'classTeacherId',
      optionsFrom: 'classTeacher',
    },
    {
      name: 'bus',
      label: 'Bus',
      type: 'dropdown',
      queryParam: 'busId',
      optionsFrom: 'bus',
    },
    {
      name: 'exitGate',
      label: 'Exit Gate',
      type: 'dropdown',
      queryParam: 'exitGateId',
      optionsFrom: 'exitGate',
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  lookups: {
    academicYear: ACADEMIC_YEAR_LOOKUP,
    classTeacher: USER_LOOKUP,
    bus: BUS_LOOKUP,
    route: ROUTE_LOOKUP,
    exitGate: EXIT_GATE_LOOKUP,
    parent: PARENT_LOOKUP,
  },

  fields: [
    // ── Tab 1: Basic ──
    {
      name: 'AdmissionNumber',
      label: 'Admission Number',
      type: 'text',
      required: true,
      maxLength: 30,
      tab: BASIC,
      hint: 'Unique across the school.',
    },
    { name: 'FirstName', label: 'First Name', type: 'text', required: true, maxLength: 60, tab: BASIC },
    { name: 'MiddleName', label: 'Middle Name', type: 'text', maxLength: 60, tab: BASIC },
    { name: 'LastName', label: 'Last Name', type: 'text', required: true, maxLength: 60, tab: BASIC },
    {
      name: 'Grade',
      label: 'Grade',
      type: 'text',
      required: true,
      maxLength: 20,
      tab: BASIC,
      hint: 'Text, not a number — Nursery, Jr KG, Sr KG, 1-12.',
    },
    { name: 'Division', label: 'Division', type: 'text', required: true, maxLength: 10, tab: BASIC },
    {
      name: 'AcademicYearId',
      label: 'Academic Year',
      type: 'dropdown',
      required: true,
      optionsFrom: 'academicYear',
      tab: BASIC,
    },
    {
      name: 'ClassTeacherId',
      label: 'Class Teacher',
      type: 'dropdown',
      optionsFrom: 'classTeacher',
      tab: BASIC,
    },
    {
      name: 'PhotoUrl',
      label: 'Photo',
      type: 'file',
      // The value on the wire is still the stored path, so the column's
      // nvarchar(500) limit still applies.
      maxLength: 500,
      tab: BASIC,
    },
    { ...IS_ACTIVE_FIELD, tab: BASIC },

    // ── Tab 2: Transport ──
    {
      name: 'UsesTransport',
      label: 'Uses School Transport',
      type: 'toggle',
      value: true,
      tab: TRANSPORT,
    },
    {
      name: 'RouteId',
      label: 'Route',
      type: 'dropdown',
      optionsFrom: 'route',
      tab: TRANSPORT,
      visibleWhen: { field: 'UsesTransport', equals: true },
      hint: 'The route serving the child’s address. The bus is taken from the current allocation for that route.',
    },
    {
      name: 'ExitGateId',
      label: 'Exit Gate',
      type: 'dropdown',
      optionsFrom: 'exitGate',
      tab: TRANSPORT,
      visibleWhen: { field: 'UsesTransport', equals: true },
      hint: 'Which door the child leaves by. The indoor LED panels filter on this.',
    },
    {
      name: 'PickupStop',
      label: 'Pickup Stop',
      type: 'text',
      maxLength: 150,
      tab: TRANSPORT,
      visibleWhen: { field: 'UsesTransport', equals: true },
    },
    {
      name: 'DropStop',
      label: 'Drop Stop',
      type: 'text',
      maxLength: 150,
      tab: TRANSPORT,
      visibleWhen: { field: 'UsesTransport', equals: true },
    },
    // RfidTag is intentionally absent: the column and the server support it, but
    // nothing reads it until the tap-in phase lands, and a field whose own hint
    // says "leave blank" is just clutter. Add it back with that phase.

    // ── Tab 3: Parents ──
    {
      name: 'Parents',
      label: 'Parents & Guardians',
      type: 'collection',
      tab: PARENTS,
      addRowLabel: 'Add parent',
      emptyText: 'No parent linked yet — add this child’s contacts here.',
      hint:
        'The parent must already exist in Parent Master. Exactly one contact can be ' +
        'the primary — choosing another moves it.',
      columns: [
        {
          key: 'ParentId',
          label: 'Parent',
          type: 'dropdown',
          optionsFrom: 'parent',
          required: true,
          width: '2.2fr',
        },
        {
          key: 'Relation',
          label: 'Relation',
          type: 'dropdown',
          optionsList: RELATION_OPTIONS,
          required: true,
          width: '1.4fr',
        },
        { key: 'IsPrimaryContact', label: 'Primary', type: 'radio', width: '5rem' },
        { key: 'IsEmergencyContact', label: 'Emergency', type: 'toggle', width: '6rem' },
        {
          key: 'IsAuthorisedForPickup',
          label: 'Can collect',
          type: 'toggle',
          value: true,
          width: '6.5rem',
        },
        {
          key: 'ReceivesNotifications',
          label: 'Notify',
          type: 'toggle',
          value: true,
          width: '5rem',
        },
      ],
      collection: {
        load: (studentId) => `/StudentMaster/${studentId}/parents`,
        toRow: (item) => ({
          MappingId: item.MappingId,
          ParentId: item.ParentId,
          Relation: item.Relation,
          IsPrimaryContact: item.IsPrimaryContact,
          IsEmergencyContact: item.IsEmergencyContact,
          IsAuthorisedForPickup: item.IsAuthorisedForPickup,
          ReceivesNotifications: item.ReceivesNotifications,
          ContactPriority: item.ContactPriority,
        }),
        rowId: (row) => (row['MappingId'] as number) ?? null,
        rowLabel: (row) => String(row['Relation'] || 'this parent').toLowerCase(),
        // A row is only worth sending once both halves of the link are chosen.
        isComplete: (row) => row['ParentId'] != null && !!row['Relation'],
        create: (studentId, row) => ({
          path: '/StudentParentMapping',
          body: {
            StudentId: studentId,
            ParentId: toId(row['ParentId']),
            Relation: row['Relation'],
            IsPrimaryContact: !!row['IsPrimaryContact'],
            IsEmergencyContact: !!row['IsEmergencyContact'],
            IsAuthorisedForPickup: !!row['IsAuthorisedForPickup'],
            ReceivesNotifications: !!row['ReceivesNotifications'],
            ContactPriority: row['IsPrimaryContact'] ? 1 : 2,
          },
        }),
        // StudentId and ParentId are absent by design — the server's update model
        // has neither, so an existing link cannot be re-pointed at another parent.
        // Changing who is linked means removing the row and adding a new one.
        update: (mappingId, row) => ({
          path: `/StudentParentMapping/${mappingId}`,
          body: {
            Relation: row['Relation'],
            IsPrimaryContact: !!row['IsPrimaryContact'],
            IsEmergencyContact: !!row['IsEmergencyContact'],
            IsAuthorisedForPickup: !!row['IsAuthorisedForPickup'],
            ReceivesNotifications: !!row['ReceivesNotifications'],
            ContactPriority: row['IsPrimaryContact'] ? 1 : 2,
          },
        }),
        remove: (mappingId) => `/StudentParentMapping/${mappingId}`,
      },
    },
  ],

  duplicateCheckFields: ['AdmissionNumber'],

  toRow: (item) => ({
    id: item.Id,
    AdmissionNumber: item.AdmissionNumber,
    Name: item.FullName,
    Class: item.Class,
    ClassTeacherName: item.ClassTeacherName ?? '-',
    BusNumber: item.BusNumber ?? '-',
    RouteName: item.RouteName ?? '-',
    ExitGateName: item.ExitGateName ?? '-',
    PrimaryContact: item.PrimaryContactName
      ? `${item.PrimaryContactName} · ${item.PrimaryContactMobile ?? ''}`.trim()
      : '-',
    Status: activeLabel(item.IsActive),
    // Kept for the edit form.
    FirstName: item.FirstName,
    MiddleName: item.MiddleName ?? '',
    LastName: item.LastName,
    Grade: item.Grade,
    Division: item.Division,
    AcademicYearId: item.AcademicYearId,
    ClassTeacherId: item.ClassTeacherId,
    RouteId: item.RouteId,
    ExitGateId: item.ExitGateId,
    PhotoUrl: item.PhotoUrl ?? '',
    PickupStop: item.PickupStop ?? '',
    DropStop: item.DropStop ?? '',
    UsesTransport: item.UsesTransport,
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    AdmissionNumber: row.AdmissionNumber,
    FirstName: row.FirstName,
    MiddleName: row.MiddleName,
    LastName: row.LastName,
    Grade: row.Grade,
    Division: row.Division,
    AcademicYearId: row.AcademicYearId,
    ClassTeacherId: row.ClassTeacherId,
    PhotoUrl: row.PhotoUrl,
    IsActive: row.IsActive,
    UsesTransport: row.UsesTransport,
    RouteId: row.RouteId,
    ExitGateId: row.ExitGateId,
    PickupStop: row.PickupStop,
    DropStop: row.DropStop,
  }),

  toCreate: (result) => ({
    AdmissionNumber: result.AdmissionNumber,
    FirstName: result.FirstName,
    MiddleName: result.MiddleName || null,
    LastName: result.LastName,
    Grade: result.Grade,
    Division: result.Division,
    AcademicYearId: toId(result.AcademicYearId),
    ClassTeacherId: toId(result.ClassTeacherId),
    PhotoUrl: result.PhotoUrl || null,
    UsesTransport: !!result.UsesTransport,
    ...transportFields(result),
  }),

  toUpdate: (result) => ({
    AdmissionNumber: result.AdmissionNumber,
    FirstName: result.FirstName,
    MiddleName: result.MiddleName || null,
    LastName: result.LastName,
    Grade: result.Grade,
    Division: result.Division,
    AcademicYearId: toId(result.AcademicYearId),
    ClassTeacherId: toId(result.ClassTeacherId),
    PhotoUrl: result.PhotoUrl || null,
    UsesTransport: !!result.UsesTransport,
    IsActive: result.IsActive,
    ...transportFields(result),
  }),
};

/**
 * A child who does not use school transport has no route, stops or exit gate —
 * the fields are hidden, and their values are cleared rather than left behind as
 * stale data.
 *
 * No BusId: the child is enrolled on a route, and the server resolves the bus
 * from the allocation in force. See StudentMasterService.
 */
function transportFields(result: any): Record<string, unknown> {
  if (!result.UsesTransport) {
    return {
      RouteId: null,
      ExitGateId: null,
      PickupStop: null,
      DropStop: null,
    };
  }

  return {
    RouteId: toId(result.RouteId),
    ExitGateId: toId(result.ExitGateId),
    PickupStop: result.PickupStop || null,
    DropStop: result.DropStop || null,
  };
}
