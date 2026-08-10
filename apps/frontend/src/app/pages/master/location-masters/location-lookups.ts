import { LookupConfig } from '../../../core/api/lookup.service';

/**
 * The Country -> Region -> State -> City -> PinCode chain, shared by every
 * location master so the cascade is declared once.
 *
 * This backend has no *DD endpoints; options come from the ordinary list
 * endpoints (see LookupService).
 */
export const COUNTRY_LOOKUP: LookupConfig = {
  resource: 'CountryMaster',
  labelField: 'CountryName',
  codeField: 'CountryCode',
};

export const REGION_LOOKUP: LookupConfig = {
  resource: 'RegionMaster',
  labelField: 'RegionName',
  codeField: 'RegionCode',
  parentParam: 'countryId',
};

export const STATE_LOOKUP: LookupConfig = {
  resource: 'StateMaster',
  labelField: 'StateName',
  codeField: 'StateCode',
  parentParam: 'countryId',
};

/** CityMaster filters by state, not by country. */
export const CITY_LOOKUP: LookupConfig = {
  resource: 'CityMaster',
  labelField: 'CityName',
  codeField: 'CityCode',
  parentParam: 'stateId',
};

/** Reused by every location master's IsActive field. */
export const IS_ACTIVE_FIELD = {
  name: 'IsActive',
  label: 'Status',
  type: 'toggle' as const,
  value: true,
  onLabel: 'Active',
  offLabel: 'Inactive',
  // The server defaults new rows to active, so Add does not ask.
  omitOnCreate: true,
};

export function activeLabel(isActive: unknown): string {
  return isActive ? 'Active' : 'Inactive';
}

/** The dialog's native <select> hands back the option value as a string. */
export function toId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}
