import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel, toId } from '../location-masters/location-lookups';
import { DropdownModel } from '../../../components/constants';
import { LookupConfig } from '../../../core/api/lookup.service';

const STATE_LOOKUP: LookupConfig = {
  resource: 'StateMaster',
  labelField: 'StateName',
  codeField: 'StateCode',
};

const CITY_BY_STATE_LOOKUP: LookupConfig = {
  resource: 'CityMaster',
  labelField: 'CityName',
  parentParam: 'stateId',
};

const PINCODE_BY_CITY_LOOKUP: LookupConfig = {
  resource: 'PinCodeMaster',
  labelField: 'PinCode',
  parentParam: 'cityId',
};

/** Checked when a guardian collects a child at the gate. */
const ID_PROOF_OPTIONS: DropdownModel[] = [
  { name: 'Aadhaar', value: 'Aadhaar' },
  { name: 'PAN', value: 'PAN' },
  { name: 'Driving Licence', value: 'DL' },
];

const CONTACT = 'Contact';
const ADDRESS = 'Address';

/**
 * C3 — Parent Master (WEB-APP-SCREENS.docx §Group C).
 *
 * A parent as a person. The relationship to a child is NOT here — that lives in
 * the Student-Parent Mapping, because the same father can be the primary contact
 * for one child and only an emergency contact for another.
 *
 * MobileNumber is the parent's real identity and the key used to avoid creating
 * duplicates across siblings. GET /api/ParentMaster/by-mobile/{mobile} exists for
 * a pre-create duplicate check; it is not wired into this screen yet, so the
 * server's own refusal is what catches a duplicate.
 */
export const PARENT_MASTER_CONFIG: MasterPageConfig = {
  title: 'Parent Master',
  singular: 'Parent',
  listTitle: 'Parent List',
  resource: 'ParentMaster',
  defaultSortBy: 'FirstName',
  exportFileName: 'Parent_Master',

  entityLabel: (row) => row.Name,

  columns: [
    { key: 'Name', label: 'Name' },
    { key: 'MobileNumber', label: 'Mobile', width: '150px' },
    { key: 'Email', label: 'Email' },
    { key: 'CityName', label: 'City', width: '150px' },
    { key: 'Verified', label: 'Verified', width: '120px', type: 'badge' },
    { key: 'ChildrenCount', label: 'Children', width: '110px' },
    { key: 'Status', label: 'Status', width: '110px', type: 'badge' },
  ],

  // ParentMasterController takes only the standard pagination filter plus status.
  filters: [
    {
      name: 'search',
      label: 'Search',
      type: 'search',
      queryParam: 'SearchTerm',
      placeholder: 'Name, mobile or email',
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  lookups: {
    state: STATE_LOOKUP,
    city: CITY_BY_STATE_LOOKUP,
    pinCode: PINCODE_BY_CITY_LOOKUP,
  },

  fields: [
    // ── Contact ──
    { name: 'FirstName', label: 'First Name', type: 'text', required: true, maxLength: 60, tab: CONTACT },
    { name: 'MiddleName', label: 'Middle Name', type: 'text', maxLength: 60, tab: CONTACT },
    { name: 'LastName', label: 'Last Name', type: 'text', required: true, maxLength: 60, tab: CONTACT },
    {
      name: 'MobileNumber',
      label: 'Mobile Number',
      type: 'text',
      required: true,
      maxLength: 15,
      tab: CONTACT,
      hint: 'The parent\'s identity — used to avoid duplicates across siblings.',
    },
    { name: 'AltMobileNumber', label: 'Alternate Mobile', type: 'text', maxLength: 15, tab: CONTACT },
    { name: 'Email', label: 'Email', type: 'email', maxLength: 150, tab: CONTACT },
    { name: 'Occupation', label: 'Occupation', type: 'text', maxLength: 100, tab: CONTACT },
    {
      name: 'IsWhatsAppEnabled',
      label: 'WhatsApp Notifications',
      type: 'toggle',
      value: true,
      tab: CONTACT,
    },
    { name: 'IsSmsEnabled', label: 'SMS Notifications', type: 'toggle', value: true, tab: CONTACT },
    { ...IS_ACTIVE_FIELD, tab: CONTACT },

    // ── Address & ID ──
    { name: 'AddressLine1', label: 'Address Line 1', type: 'text', maxLength: 200, tab: ADDRESS },
    { name: 'AddressLine2', label: 'Address Line 2', type: 'text', maxLength: 200, tab: ADDRESS },
    { name: 'StateId', label: 'State', type: 'dropdown', optionsFrom: 'state', tab: ADDRESS },
    {
      name: 'CityId',
      label: 'City',
      type: 'dropdown',
      optionsFrom: 'city',
      dependsOn: 'StateId',
      tab: ADDRESS,
    },
    {
      name: 'PinCodeId',
      label: 'PinCode',
      type: 'dropdown',
      optionsFrom: 'pinCode',
      dependsOn: 'CityId',
      tab: ADDRESS,
    },
    {
      name: 'IdProofType',
      label: 'ID Proof Type',
      type: 'dropdown',
      optionsList: ID_PROOF_OPTIONS,
      tab: ADDRESS,
      hint: 'Checked when a guardian collects a child at the gate.',
    },
    { name: 'IdProofNumber', label: 'ID Proof Number', type: 'text', maxLength: 50, tab: ADDRESS },
    { name: 'PhotoUrl', label: 'Photo URL', type: 'text', maxLength: 500, tab: ADDRESS },
  ],

  duplicateCheckFields: ['MobileNumber'],

  toRow: (item) => ({
    id: item.Id,
    Name: item.FullName,
    MobileNumber: item.MobileNumber,
    Email: item.Email ?? '-',
    CityName: item.CityName ?? '-',
    // Becomes true only after the parent completes OTP verification.
    Verified: item.IsMobileVerified ? 'Verified' : 'Not verified',
    ChildrenCount: item.ChildrenCount ?? 0,
    Status: activeLabel(item.IsActive),
    FirstName: item.FirstName,
    MiddleName: item.MiddleName ?? '',
    LastName: item.LastName,
    AltMobileNumber: item.AltMobileNumber ?? '',
    Occupation: item.Occupation ?? '',
    AddressLine1: item.AddressLine1 ?? '',
    AddressLine2: item.AddressLine2 ?? '',
    StateId: item.StateId,
    CityId: item.CityId,
    PinCodeId: item.PinCodeId,
    IdProofType: item.IdProofType ?? '',
    IdProofNumber: item.IdProofNumber ?? '',
    PhotoUrl: item.PhotoUrl ?? '',
    IsWhatsAppEnabled: item.IsWhatsAppEnabled,
    IsSmsEnabled: item.IsSmsEnabled,
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    FirstName: row.FirstName,
    MiddleName: row.MiddleName,
    LastName: row.LastName,
    MobileNumber: row.MobileNumber,
    AltMobileNumber: row.AltMobileNumber,
    Email: row.Email === '-' ? '' : row.Email,
    Occupation: row.Occupation,
    IsWhatsAppEnabled: row.IsWhatsAppEnabled,
    IsSmsEnabled: row.IsSmsEnabled,
    IsActive: row.IsActive,
    AddressLine1: row.AddressLine1,
    AddressLine2: row.AddressLine2,
    StateId: row.StateId,
    CityId: row.CityId,
    PinCodeId: row.PinCodeId,
    IdProofType: row.IdProofType,
    IdProofNumber: row.IdProofNumber,
    PhotoUrl: row.PhotoUrl,
  }),

  toCreate: (result) => ({ ...parentBody(result) }),

  // IsMobileVerified is server-owned (set after OTP) and is never sent from here.
  toUpdate: (result) => ({ ...parentBody(result), IsActive: result.IsActive }),
};

function parentBody(result: any): Record<string, unknown> {
  return {
    FirstName: result.FirstName,
    MiddleName: result.MiddleName || null,
    LastName: result.LastName,
    MobileNumber: result.MobileNumber,
    AltMobileNumber: result.AltMobileNumber || null,
    Email: result.Email || null,
    Occupation: result.Occupation || null,
    AddressLine1: result.AddressLine1 || null,
    AddressLine2: result.AddressLine2 || null,
    StateId: toId(result.StateId),
    CityId: toId(result.CityId),
    PinCodeId: toId(result.PinCodeId),
    PhotoUrl: result.PhotoUrl || null,
    IdProofType: result.IdProofType || null,
    IdProofNumber: result.IdProofNumber || null,
    IsWhatsAppEnabled: !!result.IsWhatsAppEnabled,
    IsSmsEnabled: !!result.IsSmsEnabled,
  };
}
