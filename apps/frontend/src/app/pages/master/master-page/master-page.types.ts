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
  | 'toggle'
  | 'file'
  /** A list of linked child records — see `columns` and `collection`. */
  | 'collection';

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
  /**
   * `file` fields only. The control's value stays the stored URL/path string,
   * so maxLength still applies to it.
   */
  accept?: string;
  maxFileSizeMb?: number;
  /** `collection` fields only: the per-row editors. */
  columns?: MasterCollectionColumn[];
  /** `collection` fields only: how rows are read back and written. */
  collection?: MasterCollectionSync;
  /** `collection` fields only: the add-row button's text. */
  addRowLabel?: string;
  emptyText?: string;
}

export interface MasterCollectionColumn {
  key: string;
  label: string;
  /** 'radio' is a boolean only one row may hold, e.g. the primary contact. */
  type: 'dropdown' | 'text' | 'number' | 'toggle' | 'radio';
  optionsList?: DropdownModel[];
  /** Key into MasterPageConfig.lookups. */
  optionsFrom?: string;
  required?: boolean;
  width?: string;
  value?: unknown;
}

/**
 * A collection is not part of the parent's own payload — its rows are separate
 * records with their own endpoint. This describes how to read them back and how
 * to turn edits into requests; MasterPageComponent owns the sequencing, including
 * the case where the parent saves and a row does not.
 */
export interface MasterCollectionSync {
  /** GET path for an existing parent's rows. */
  load: (parentId: number) => string;
  /** A row from that response -> a form row. */
  toRow: (item: any) => Record<string, unknown>;
  /**
   * The row's own record id, or null for a row the user has just added. Drives
   * whether a row is created, patched or deleted.
   */
  rowId: (row: Record<string, unknown>) => number | null;
  /** Human label for one row, used in error messages. */
  rowLabel: (row: Record<string, unknown>) => string;
  /** Skips rows the user added but never filled in. */
  isComplete: (row: Record<string, unknown>) => boolean;
  create: (parentId: number, row: Record<string, unknown>) => { path: string; body: unknown };
  update?: (rowId: number, row: Record<string, unknown>) => { path: string; body: unknown };
  remove?: (rowId: number) => string;
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

/**
 * An extra per-row button that posts to a non-CRUD endpoint — e.g. substituting
 * a reserve bus onto a route for one day.
 *
 * Deliberately declarative. A config is data and mappers; handing it services to
 * call would make every screen a place logic can hide. MasterPageComponent owns
 * the dialog, the POST and the refresh; this only describes them.
 */
export interface MasterRowAction<TRow = any> {
  /** Button text in the row's action column. */
  label: string;
  /** Rows the action does not apply to are left without a button. */
  visibleFor?: (row: TRow) => boolean;
  /** Dialog heading. */
  title: (row: TRow) => string;
  /** Defaults to the label. */
  saveButtonText?: string;
  /** Dialog fields; `optionsFrom` resolves against the same `lookups` map. */
  fields: MasterFieldConfig[];
  /** Row -> dialog prefill. */
  toFormData?: (row: TRow) => Record<string, unknown>;
  /** Message to confirm before posting, or null to post straight away. */
  confirmBefore?: (row: TRow, result: any) => string | null;
  /** Row + dialog result -> the request to send. */
  request: (row: TRow, result: any) => { path: string; body: unknown };
  /** Toast on success. The server's own message is used when this is absent. */
  successMessage?: string;
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

  /** An extra per-row button beside view/edit/delete. */
  rowAction?: MasterRowAction<TRow>;

  /** Hides Add/Edit/Delete entirely. */
  readOnly?: boolean;
  /** Base name for the CSV export. Defaults to the resource name. */
  exportFileName?: string;
  /**
   * Default sort column sent as SortBy. Only the values a service's own switch
   * recognises have any effect — most accept 'CreatedAt' plus one or two of
   * their own columns, and anything else falls back to the service's default
   * ordering.
   */
  defaultSortBy?: string;

  /**
   * Sends Descending=true with the sort. Pair it with `defaultSortBy: 'CreatedAt'`
   * on screens where the record just added should be the first one you see rather
   * than something to go hunting for on page 4.
   */
  defaultDescending?: boolean;
}
