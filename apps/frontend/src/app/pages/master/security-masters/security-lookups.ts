import { LookupConfig } from '../../../core/api/lookup.service';

/** Shared by the Group B security masters and by anything that picks a user. */

export const ROLE_LOOKUP: LookupConfig = {
  resource: 'RoleMaster',
  labelField: 'RoleName',
};

export const USER_LOOKUP: LookupConfig = {
  resource: 'UserMaster',
  labelField: 'Name',
};
