import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel } from '../location-masters/location-lookups';

/**
 * C1 — Academic Year Master (WEB-APP-SCREENS.docx §Group C).
 *
 * Only one row may have IsCurrent = true, enforced by a filtered unique index in
 * the database. Setting a second one is refused by the server, so the UI asks
 * first rather than letting the save fail.
 */
export const ACADEMIC_YEAR_MASTER_CONFIG: MasterPageConfig = {
  title: 'Academic Year Master',
  singular: 'Academic Year',
  listTitle: 'Academic Year List',
  resource: 'AcademicYearMaster',
  // Newest first: a record you just added should be the first one you see.
  defaultSortBy: 'CreatedAt',
  defaultDescending: true,
  exportFileName: 'Academic_Year_Master',

  entityLabel: (row) => row.YearName,

  columns: [
    { key: 'YearName', label: 'Year Name', width: '160px' },
    { key: 'StartDate', label: 'Start Date', width: '150px' },
    { key: 'EndDate', label: 'End Date', width: '150px' },
    { key: 'Current', label: 'Current', width: '120px', type: 'badge' },
    { key: 'StudentCount', label: 'Students', width: '120px' },
    { key: 'Status', label: 'Status', width: '110px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  fields: [
    {
      name: 'YearName',
      label: 'Year Name',
      type: 'text',
      required: true,
      maxLength: 9,
      pattern: /^\d{4}-\d{4}$/,
      hint: 'Nine characters, e.g. 2026-2027.',
    },
    { name: 'StartDate', label: 'Start Date', type: 'date', required: true },
    { name: 'EndDate', label: 'End Date', type: 'date', required: true },
    {
      name: 'IsCurrent',
      label: 'Current Year',
      type: 'toggle',
      hint: 'Only one academic year can be current at a time.',
    },
    IS_ACTIVE_FIELD,
  ],

  duplicateCheckFields: ['YearName'],

  confirmBeforeSave: (result) =>
    result.IsCurrent
      ? 'This will make it the current academic year, replacing whichever year is ' +
        'current now. New students default to the current year. Continue?'
      : null,

  toRow: (item) => ({
    id: item.Id,
    YearName: item.YearName,
    StartDate: formatDate(item.StartDate),
    EndDate: formatDate(item.EndDate),
    Current: item.IsCurrent ? 'Current' : '-',
    StudentCount: item.StudentCount ?? 0,
    Status: activeLabel(item.IsActive),
    IsActive: item.IsActive,
    IsCurrent: item.IsCurrent,
    RawStartDate: item.StartDate ?? '',
    RawEndDate: item.EndDate ?? '',
  }),

  toFormData: (row) => ({
    YearName: row.YearName,
    StartDate: row.RawStartDate,
    EndDate: row.RawEndDate,
    IsCurrent: row.IsCurrent,
    IsActive: row.IsActive,
  }),

  toCreate: (result) => ({
    YearName: result.YearName,
    StartDate: result.StartDate,
    EndDate: result.EndDate,
    IsCurrent: !!result.IsCurrent,
  }),

  toUpdate: (result) => ({
    YearName: result.YearName,
    StartDate: result.StartDate,
    EndDate: result.EndDate,
    IsCurrent: !!result.IsCurrent,
    IsActive: result.IsActive,
  }),
};

function formatDate(value: unknown): string {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
