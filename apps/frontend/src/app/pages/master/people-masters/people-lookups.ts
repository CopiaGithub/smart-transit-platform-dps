import { DropdownModel } from '../../../components/constants';
import { LookupConfig } from '../../../core/api/lookup.service';

/** Shared by the Group C masters — students, parents and the link between them. */

export const STUDENT_LOOKUP: LookupConfig = {
  resource: 'StudentMaster',
  labelField: 'FullName',
  codeField: 'AdmissionNumber',
};

export const PARENT_LOOKUP: LookupConfig = {
  resource: 'ParentMaster',
  labelField: 'FullName',
  codeField: 'MobileNumber',
};

/**
 * Mirrors CK_student_parent_mapping_Relation and the ValidRelations array in
 * StudentParentMappingService — the server rejects anything else, so this is a
 * fixed list rather than free text.
 */
export const RELATION_OPTIONS: DropdownModel[] = [
  'Father',
  'Mother',
  'Guardian',
  'Grandfather',
  'Grandmother',
  'Uncle',
  'Aunt',
  'Sibling',
  'Driver',
  'Other',
].map((name) => ({ name, value: name }));
