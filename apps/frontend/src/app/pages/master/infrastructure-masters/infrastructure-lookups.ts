import { DropdownModel } from '../../../components/constants';
import { LookupConfig } from '../../../core/api/lookup.service';

/** Shared by the Group E infrastructure masters. */

export const GATE_LOOKUP: LookupConfig = {
  resource: 'GateMaster',
  labelField: 'GateName',
  codeField: 'GateCode',
};

/**
 * Gate 6 is the bus entry, Gate 1 is the bus exit, and two student exits serve
 * the indoor displays.
 */
export const GATE_TYPE_OPTIONS: DropdownModel[] = [
  { name: 'Bus Entry', value: 'BusEntry' },
  { name: 'Bus Exit', value: 'BusExit' },
  { name: 'Student Exit', value: 'StudentExit' },
];

/** Which arm of the U-shaped compound a platform sits on. */
export const PLATFORM_SIDE_OPTIONS: DropdownModel[] = [
  { name: 'Left', value: 'Left' },
  { name: 'Right', value: 'Right' },
];

export const DISPLAY_TYPE_OPTIONS: DropdownModel[] = [
  { name: 'Outdoor', value: 'Outdoor' },
  { name: 'Indoor', value: 'Indoor' },
];

export function gateTypeLabel(value: unknown): string {
  return GATE_TYPE_OPTIONS.find((o) => o.value === value)?.name ?? String(value ?? '-');
}

/**
 * "3 minutes ago" for the display heartbeat. A panel that has never checked in
 * says so plainly rather than showing an empty cell.
 */
export function relativeTime(value: unknown): string {
  if (!value) return 'Never';

  const then = new Date(String(value)).getTime();
  if (Number.isNaN(then)) return String(value);

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
