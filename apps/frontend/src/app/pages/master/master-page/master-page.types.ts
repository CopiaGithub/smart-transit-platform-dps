import { DropdownModel } from '../../../components/constants';
import { LookupConfig } from '../../../core/api/lookup.service';

/**
 * One reusable pattern for all 20 master screens (WEB-APP-SCREENS.docx §4.0).
 * A master screen is a config object, not a hand-written component.
 */

export type MasterFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'textarea'
  | 'dropdown'
  | 'autocomplete'
  | 'date'
  | 'toggle';

export interface MasterFieldConfig {
  /** Form control name, and the key on the dialog result. */
  name: string;
  label: string;
  type: MasterFieldType;
  required?: boolean;
  /** Mirror the server's MaxLength so the form refuses what the server would. */
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  /** Static options. For server-backed options use `optionsFrom`. */
  optionsList?: DropdownModel[];
  /** Key into MasterPageConfig.lookups. */
  optionsFrom?: string;
  /**
   * Field name of the cascade parent. While the parent is empty this field has
   * no options; when the parent changes the value is cleared.
   */
  dependsOn?: string;
  /** Default when the record carries no value. */
  value?: unknown;
  visibleWhen?: { field: string; equals: unknown };
  /** Hidden on the Add form (e.g. IsActive, which the server defaults to true). */
  omitOnCreate?: boolean;
  /** Required when creating, optional when editing — e.g. a password. */
  requiredOnCreate?: boolean;
  /** Shown but not editable once the record exists (immutable foreign keys). */
  readonlyOnEdit?: boolean;
  /** Groups the field under a tab. Tabs appear only if some field declares one. */
  tab?: string;
  /** Helper text under the control. */
  hint?: string;
  /** Text beside a toggle. Defaults to Yes / No. */
  onLabel?: string;
  offLabel?: string;
}

export type MasterFilterType = 'search' | 'dropdown' | 'status';

export interface MasterFilterConfig {
  name: string;
  label: string;
  type: MasterFilterType;
  placeholder?: string;
  /** Query-string parameter, e.g. 'SearchTerm' | 'countryId' | 'IsActive'. */
  queryParam: string;
  /** Fixed options (enums). For server-backed options use `optionsFrom`. */
  optionsList?: DropdownModel[];
  optionsFrom?: string;
  dependsOn?: string;
  /** Which half of the selected DropdownModel goes on the wire. Default 'value'. */
  emit?: 'value' | 'name';
}

export interface MasterColumnConfig {
  key: string;
  label: string;
  width?: string;
  /**
   * Cell renderer. 'badge' draws a coloured pill, coloured from the value by
   * TableComponent.badgeClass() — used for status-like columns.
   */
  type?: 'badge';
}

export interface MasterPageConfig<TItem = any, TRow = any> {
  /** Page title, e.g. 'Country Master'. */
  title: string;
  /**
   * One record, for dialog titles and toasts ("Add New Bus"). Defaults to the
   * title minus a trailing "Master", which is wrong for plurals like
   * "Buses Master" and "Routes Master".
   */
  singular?: string;
  /** Table card title, e.g. 'Country Master List'. */
  listTitle: string;
  /** Controller name, e.g. 'CountryMaster'. */
  resource: string;
  /** Primary key field on the API item. Defaults to 'Id'. */
  idField?: string;
  /** Names the record in the delete confirmation. */
  entityLabel: (row: TRow) => string;

  columns: MasterColumnConfig[];
  filters: MasterFilterConfig[];
  fields: MasterFieldConfig[];
  lookups?: Record<string, LookupConfig>;

  /** API item -> table row. Must keep the id under `id`. */
  toRow: (item: TItem) => TRow;
  /** Table row -> dialog prefill, keyed by field name. */
  toFormData: (row: TRow) => Record<string, unknown>;
  /**
   * Dialog result -> POST body (PascalCase, matching the *CreateModel).
   * `any` rather than an index-signature record: tsconfig sets
   * noPropertyAccessFromIndexSignature, which would force result['Field'].
   */
  toCreate: (result: any) => unknown;
  /** Dialog result -> PATCH body (PascalCase, matching the *UpdateModel). */
  toUpdate: (result: any) => unknown;

  /**
   * Client-side duplicate hint. It only sees the current page, so it is a
   * convenience — the server owns uniqueness and its refusal is what counts.
   */
  duplicateCheckFields?: string[];

  /**
   * Returns a message to confirm before saving, or null to save straight away.
   * Used where a save has a side effect the user should be warned about — e.g.
   * setting a new current academic year, or renaming a role.
   */
  confirmBeforeSave?: (result: any, mode: 'create' | 'edit') => string | null;

  /** Hides Add/Edit/Delete entirely. */
  readOnly?: boolean;
  /** Base name for the CSV export. Defaults to the resource name. */
  exportFileName?: string;
  /** Default sort column sent as SortBy. */
  defaultSortBy?: string;
}
