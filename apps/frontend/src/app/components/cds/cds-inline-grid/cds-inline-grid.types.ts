export type InlineGridColumnType =
  | 'text'
  | 'number'
  | 'select'
  | 'date'
  | 'readonly'
  | 'masterSelect'
  | 'masterAutocomplete';

export interface InlineGridColumn {
  key: string;
  label: string;
  type?: InlineGridColumnType;
  width?: string;
  highlight?: boolean;
  /** @deprecated Use masterKey + masterOptions on grid for master data */
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  /** Key into grid masterOptions map (dealer, region, state, …) */
  masterKey?: string;
}

export interface InlineGridRow {
  id: string | number;
  _isNew?: boolean;
  [key: string]: unknown;
}
