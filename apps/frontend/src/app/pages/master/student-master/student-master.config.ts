import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel, toId } from '../location-masters/location-lookups';
import { BUS_LOOKUP, ROUTE_LOOKUP } from '../transport-masters/transport-lookups';
import { USER_LOOKUP } from '../security-masters/security-lookups';
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
};

const BASIC = 'Basic';
const TRANSPORT = 'Transport';

/**
 * C2 — Student Master (WEB-APP-SCREENS.docx §Group C). The biggest form, split
 * into the two tabs the spec asks for.
 *
 * Grade is text, not a number — it covers Nursery, Jr KG and Sr KG as well as
 * 1 to 12.
 *
 * RouteId is deliberately its own field and is never derived from BusId: when a
 * reserve bus substitutes, the bus changes but the child's route does not.
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
    { key: 'BusNumber', label: 'Bus', width: '100px' },
    { key: 'RouteName', label: 'Route' },
    { key: 'ExitGateName', label: 'Exit Gate' },
    { key: 'PrimaryContact', label: 'Primary Contact' },
    { key: 'Status', label: 'Status', width: '110px', type: 'badge' },
  ],

  // The controller accepts academicYearId, grade, division, busId, exitGateId
  // and status. It has no routeId filter, so one is not offered.
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
      label: 'Photo URL',
      type: 'text',
      maxLength: 500,
      tab: BASIC,
      hint: 'A URL for now — there is no upload endpoint yet.',
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
      name: 'BusId',
      label: 'Bus',
      type: 'dropdown',
      optionsFrom: 'bus',
      tab: TRANSPORT,
      visibleWhen: { field: 'UsesTransport', equals: true },
    },
    {
      name: 'RouteId',
      label: 'Route',
      type: 'dropdown',
      optionsFrom: 'route',
      tab: TRANSPORT,
      visibleWhen: { field: 'UsesTransport', equals: true },
      hint: 'Set separately from the bus — a reserve bus does not change the route.',
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
    {
      name: 'RfidTag',
      label: 'RFID Tag',
      type: 'text',
      maxLength: 50,
      tab: TRANSPORT,
      visibleWhen: { field: 'UsesTransport', equals: true },
      hint: 'Reserved for a later phase — leave blank.',
    },
  ],

  duplicateCheckFields: ['AdmissionNumber'],

  toRow: (item) => ({
    id: item.Id,
    AdmissionNumber: item.AdmissionNumber,
    Name: item.FullName,
    Class: item.Class,
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
    BusId: item.BusId,
    RouteId: item.RouteId,
    ExitGateId: item.ExitGateId,
    PhotoUrl: item.PhotoUrl ?? '',
    PickupStop: item.PickupStop ?? '',
    DropStop: item.DropStop ?? '',
    RfidTag: item.RfidTag ?? '',
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
    BusId: row.BusId,
    RouteId: row.RouteId,
    ExitGateId: row.ExitGateId,
    PickupStop: row.PickupStop,
    DropStop: row.DropStop,
    RfidTag: row.RfidTag,
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
 * A child who does not use school transport has no bus, route, stops or exit
 * gate — the fields are hidden, and their values are cleared rather than left
 * behind as stale data.
 */
function transportFields(result: any): Record<string, unknown> {
  if (!result.UsesTransport) {
    return {
      BusId: null,
      RouteId: null,
      ExitGateId: null,
      PickupStop: null,
      DropStop: null,
      RfidTag: null,
    };
  }

  return {
    BusId: toId(result.BusId),
    RouteId: toId(result.RouteId),
    ExitGateId: toId(result.ExitGateId),
    PickupStop: result.PickupStop || null,
    DropStop: result.DropStop || null,
    RfidTag: result.RfidTag || null,
  };
}
