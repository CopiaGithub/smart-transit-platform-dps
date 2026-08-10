import { MasterPageConfig } from '../master-page/master-page.types';
import { IS_ACTIVE_FIELD, activeLabel, toId } from '../location-masters/location-lookups';
import {
  DISPLAY_TYPE_OPTIONS,
  GATE_LOOKUP,
  relativeTime,
} from '../infrastructure-masters/infrastructure-lookups';

const PANEL = 'Panel';
const HARDWARE = 'Hardware';

/**
 * E3 — Display Master / LED walls (WEB-APP-SCREENS.docx §Group E).
 *
 * Three panels: one outdoor near the entrance, two indoor at the student exits.
 *
 * DisplayCode is used in the heartbeat URL
 * (POST /api/DisplayMaster/{displayCode}/heartbeat, AllowAnonymous — the panel
 * calls it itself), so changing it silently orphans a live panel.
 *
 * LastHeartbeatAt and ConnectionStatus are monitoring fields the server owns:
 * shown in the list, never editable.
 */
export const DISPLAY_MASTER_CONFIG: MasterPageConfig = {
  title: 'Display Master',
  singular: 'Display',
  listTitle: 'LED Displays',
  resource: 'DisplayMaster',
  defaultSortBy: 'DisplayName',
  exportFileName: 'Display_Master',

  entityLabel: (row) => row.DisplayName,

  columns: [
    { key: 'DisplayCode', label: 'Code', width: '130px' },
    { key: 'DisplayName', label: 'Name' },
    { key: 'DisplayType', label: 'Type', width: '120px', type: 'badge' },
    { key: 'GateName', label: 'Gate' },
    { key: 'Location', label: 'Location' },
    { key: 'ConnectionStatus', label: 'Connection', width: '130px', type: 'badge' },
    { key: 'LastHeartbeat', label: 'Last Heartbeat', width: '170px' },
    { key: 'Status', label: 'Status', width: '110px', type: 'badge' },
  ],

  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    {
      name: 'displayType',
      label: 'Display Type',
      type: 'dropdown',
      queryParam: 'displayType',
      optionsList: DISPLAY_TYPE_OPTIONS,
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],

  lookups: { gate: GATE_LOOKUP },

  fields: [
    // ── Panel ──
    {
      name: 'DisplayCode',
      label: 'Display Code',
      type: 'text',
      required: true,
      maxLength: 20,
      tab: PANEL,
      hint: 'Unique, and used in the panel\'s heartbeat URL — changing it orphans a live panel.',
    },
    {
      name: 'DisplayName',
      label: 'Display Name',
      type: 'text',
      required: true,
      maxLength: 100,
      tab: PANEL,
    },
    {
      name: 'DisplayType',
      label: 'Display Type',
      type: 'dropdown',
      required: true,
      optionsList: DISPLAY_TYPE_OPTIONS,
      value: 'Indoor',
      tab: PANEL,
    },
    {
      name: 'GateId',
      label: 'Gate',
      type: 'dropdown',
      optionsFrom: 'gate',
      tab: PANEL,
      hint: 'Where the panel physically is.',
    },
    {
      name: 'FilterByGateId',
      label: 'Filter by Gate',
      type: 'dropdown',
      optionsFrom: 'gate',
      tab: PANEL,
      hint: 'Leave blank to show every platform. Set it to scope an indoor panel to one student exit.',
    },
    { name: 'Location', label: 'Location', type: 'text', maxLength: 50, tab: PANEL },
    { ...IS_ACTIVE_FIELD, tab: PANEL },

    // ── Hardware ──
    {
      name: 'IpAddress',
      label: 'IP Address',
      type: 'text',
      maxLength: 45,
      tab: HARDWARE,
    },
    {
      name: 'ScreenSize',
      label: 'Screen Size',
      type: 'text',
      maxLength: 20,
      tab: HARDWARE,
      hint: 'In feet, e.g. 8x8 or 4x6.',
    },
    { name: 'WidthPx', label: 'Width (px)', type: 'number', tab: HARDWARE },
    { name: 'HeightPx', label: 'Height (px)', type: 'number', tab: HARDWARE },
    {
      name: 'VisibleRowCount',
      label: 'Visible Row Count',
      type: 'number',
      value: 10,
      tab: HARDWARE,
      hint: 'How many board rows fit on screen at once.',
    },
  ],

  duplicateCheckFields: ['DisplayCode'],

  toRow: (item) => ({
    id: item.Id,
    DisplayCode: item.DisplayCode,
    DisplayName: item.DisplayName,
    DisplayType: item.DisplayType,
    GateId: item.GateId,
    GateName: item.GateName ?? '-',
    Location: item.Location ?? '-',
    ConnectionStatus: item.ConnectionStatus || 'Unknown',
    LastHeartbeat: relativeTime(item.LastHeartbeatAt),
    Status: activeLabel(item.IsActive),
    IpAddress: item.IpAddress ?? '',
    ScreenSize: item.ScreenSize ?? '',
    WidthPx: item.WidthPx,
    HeightPx: item.HeightPx,
    VisibleRowCount: item.VisibleRowCount,
    FilterByGateId: item.FilterByGateId,
    IsActive: item.IsActive,
  }),

  toFormData: (row) => ({
    DisplayCode: row.DisplayCode,
    DisplayName: row.DisplayName,
    DisplayType: row.DisplayType,
    GateId: row.GateId,
    FilterByGateId: row.FilterByGateId,
    Location: row.Location === '-' ? '' : row.Location,
    IsActive: row.IsActive,
    IpAddress: row.IpAddress,
    ScreenSize: row.ScreenSize,
    WidthPx: row.WidthPx,
    HeightPx: row.HeightPx,
    VisibleRowCount: row.VisibleRowCount,
  }),

  toCreate: (result) => ({ ...displayBody(result) }),

  // LastHeartbeatAt and ConnectionStatus are server-owned and never sent.
  toUpdate: (result) => ({ ...displayBody(result), IsActive: result.IsActive }),
};

function displayBody(result: any): Record<string, unknown> {
  return {
    DisplayCode: result.DisplayCode,
    DisplayName: result.DisplayName,
    DisplayType: result.DisplayType,
    GateId: toId(result.GateId),
    FilterByGateId: toId(result.FilterByGateId),
    Location: result.Location || null,
    IpAddress: result.IpAddress || null,
    ScreenSize: result.ScreenSize || null,
    WidthPx: toId(result.WidthPx),
    HeightPx: toId(result.HeightPx),
    VisibleRowCount: toId(result.VisibleRowCount),
  };
}
