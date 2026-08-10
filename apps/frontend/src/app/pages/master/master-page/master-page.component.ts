import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, take } from 'rxjs';

import { TableComponent } from '../../../components/cds/cds-table/table.component';
import { CdsContainerComponent } from '../../../components/cds/cds-container/cds-container.component';
import { CdsTitleComponent } from '../../../components/cds/cds-title/cds-title.component';
import { CdsButtonComponent } from '../../../components/cds/cds-button/cds-button.component';
import { CdsInputComponent } from '../../../components/cds/cds-input/cds-input.component';
import { CdsAutocompleteDropdownComponent } from '../../../components/cds/cds-autocomplete-dropdown/cds-autocomplete-dropdown.component';
import { EditModelComponent } from '../../../components/cds/edit-model/edit-model.component';
import { PopupComponent } from '../../../components/popup/popup.component';
import { GlobalFilter } from '../../../components/constants/global-filters/global-filters';
import { DropdownModel } from '../../../components/constants';

import { ApiService, QueryParams } from '../../../core/api/api.service';
import { ApiError } from '../../../core/api/api.types';
import { CrudApi, createCrudApi } from '../../../core/api/crud-api.factory';
import { LookupConfig, LookupService } from '../../../core/api/lookup.service';
import { BaseComponent, resolveErrorMessage } from '../../common/base/BaseComponent';
import {
  MasterFieldConfig,
  MasterFilterConfig,
  MasterPageConfig,
} from './master-page.types';

const SEARCH_DEBOUNCE_MS = 300;

const STATUS_OPTIONS: DropdownModel[] = [
  { name: 'Active', value: true },
  { name: 'Inactive', value: false },
];

/**
 * The one master screen. Every master in Groups A-E is a MasterPageConfig fed to
 * this component — see WEB-APP-SCREENS.docx §4.0 ("build one reusable pattern,
 * do not copy and paste it 20 times").
 *
 * What this component deliberately does NOT do (the server owns it — §5.4):
 * uniqueness checks, sort order, and any filtering or paging of its own. It
 * sends SearchTerm/PageNumber and holds exactly one page.
 */
@Component({
  selector: 'app-master-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    TableComponent,
    CdsContainerComponent,
    CdsTitleComponent,
    CdsButtonComponent,
    CdsInputComponent,
    CdsAutocompleteDropdownComponent,
    PopupComponent,
  ],
  templateUrl: './master-page.component.html',
  styleUrl: './master-page.component.css',
})
export class MasterPageComponent extends BaseComponent implements OnInit {
  @Input({ required: true }) config!: MasterPageConfig;

  private readonly api = inject(ApiService);
  private readonly lookups = inject(LookupService);

  private crud!: CrudApi<Record<string, unknown>>;

  readonly filter = new GlobalFilter();

  // All view state is signals: the app runs zoneless (no zone.js in the build),
  // so a plain field assigned inside an RxJS subscribe never repaints the view.
  readonly totalCount = signal(0);
  readonly tableData = signal<any[]>([]);
  readonly pageResetCounter = signal(0);
  /** Distinguishes "no records yet" from "no records match your filters". */
  readonly isFiltered = signal(false);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly isOffline = signal(false);

  selectedRows: any[] = [];
  filterForm!: FormGroup;

  /** Dropdown options per lookup key, scoped by the current parent selection. */
  readonly optionsByLookup = signal<Record<string, DropdownModel[]>>({});

  ngOnInit(): void {
    this.crud = createCrudApi(this.api, this.config.resource);
    this.buildFilterForm();
    this.loadRootLookups();
    this.loadData(1);
  }

  // ── Filters ──────────────────────────────────────────────────────────────

  private buildFilterForm(): void {
    const controls: Record<string, FormControl> = {};
    for (const filterConfig of this.config.filters) {
      controls[filterConfig.name] = new FormControl<unknown>(null);
    }
    this.filterForm = new FormGroup(controls);

    for (const filterConfig of this.config.filters) {
      const control = this.filterForm.get(filterConfig.name)!;

      if (filterConfig.type === 'search') {
        // Server-side search, debounced so a burst of keystrokes is one request.
        control.valueChanges
          .pipe(
            debounceTime(SEARCH_DEBOUNCE_MS),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe(() => this.loadData(1));
        continue;
      }

      // A parent selection invalidates its children: clear them and refetch
      // their options, otherwise an inconsistent pair goes on the wire.
      const children = this.config.filters.filter((f) => f.dependsOn === filterConfig.name);
      if (children.length) {
        control.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((value) => {
            const parentId = optionValue(value) as number | null;
            for (const child of children) {
              this.filterForm.get(child.name)?.setValue(null, { emitEvent: false });
              this.loadLookupFor(child, parentId);
            }
          });
      }
    }
  }

  statusOptions(): DropdownModel[] {
    return STATUS_OPTIONS;
  }

  optionsFor(filterConfig: MasterFilterConfig): DropdownModel[] {
    if (filterConfig.type === 'status') {
      return STATUS_OPTIONS;
    }
    if (filterConfig.optionsList) {
      return filterConfig.optionsList;
    }
    return filterConfig.optionsFrom
      ? (this.optionsByLookup()[filterConfig.optionsFrom] ?? [])
      : [];
  }

  /** A cascading child stays disabled until its parent is chosen. */
  isFilterDisabled(filterConfig: MasterFilterConfig): boolean {
    if (!filterConfig.dependsOn) {
      return false;
    }
    return optionValue(this.filterForm.get(filterConfig.dependsOn)?.value) == null;
  }

  private loadRootLookups(): void {
    for (const filterConfig of this.config.filters) {
      if (filterConfig.optionsFrom && !filterConfig.dependsOn) {
        this.loadLookupFor(filterConfig, null);
      }
    }
  }

  private loadLookupFor(filterConfig: MasterFilterConfig, parentId: number | null): void {
    const key = filterConfig.optionsFrom;
    const lookupConfig = key ? this.config.lookups?.[key] : undefined;
    if (!key || !lookupConfig) {
      return;
    }

    this.lookups
      .options(lookupConfig, parentId)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) =>
          this.optionsByLookup.update((current) => ({ ...current, [key]: options })),
        // A dropdown that cannot load must not take the page down with it.
        error: () =>
          this.optionsByLookup.update((current) => ({ ...current, [key]: [] })),
      });
  }

  // ── List ─────────────────────────────────────────────────────────────────

  private buildQuery(pageNumber: number): QueryParams {
    const query: QueryParams = {
      PageNumber: pageNumber,
      PageSize: this.filter.pageSize,
    };

    if (this.config.defaultSortBy) {
      query['SortBy'] = this.config.defaultSortBy;
    }

    for (const filterConfig of this.config.filters) {
      const raw = this.filterForm.get(filterConfig.name)?.value;

      if (filterConfig.type === 'search') {
        const term = typeof raw === 'string' ? raw.trim() : '';
        query[filterConfig.queryParam] = term || null;
        continue;
      }

      const option = raw as DropdownModel | null;
      query[filterConfig.queryParam] = option
        ? filterConfig.emit === 'name'
          ? option.name
          : option.value
        : null;
    }

    return query;
  }

  private hasActiveFilters(query: QueryParams): boolean {
    return this.config.filters.some(
      (f) => query[f.queryParam] !== null && query[f.queryParam] !== undefined,
    );
  }

  loadData(pageNumber: number = this.filter.currentPage): void {
    this.filter.currentPage = pageNumber;
    const query = this.buildQuery(pageNumber);
    this.isFiltered.set(this.hasActiveFilters(query));
    this.isLoading.set(true);
    this.loadError.set(null);
    this.isOffline.set(false);

    this.crud
      .list(query)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.isLoading.set(false);
          this.tableData.set((page?.Items ?? []).map((item) => this.config.toRow(item)));
          this.totalCount.set(page?.TotalRecords ?? 0);
          this.selectedRows = [];
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.tableData.set([]);
          this.totalCount.set(0);
          this.isOffline.set(error instanceof ApiError && error.isNetworkError);
          // The server's own ErrorMessage — including a 403, which must not
          // sign the user out.
          this.loadError.set(
            resolveErrorMessage(error, `Failed to load ${this.config.title}.`),
          );
        },
      });
  }

  onSearch(): void {
    this.pageResetCounter.update((n) => n + 1);
    this.loadData(1);
  }

  onClear(): void {
    this.filterForm.reset();
    this.pageResetCounter.update((n) => n + 1);
    this.loadData(1);
  }

  onPageChange(page: number): void {
    this.loadData(page);
  }

  onSelectionChange(selected: any[]): void {
    this.selectedRows = Array.from(selected ?? []);
  }

  onRetry(): void {
    this.loadData(this.filter.currentPage);
  }

  /** Name for one record — used in dialog titles and success messages. */
  private get singular(): string {
    return this.config.singular ?? this.config.title.replace(/ Master$/i, '');
  }

  readonly emptyStateMessage = computed(() =>
    this.isFiltered()
      ? 'No records match these filters.'
      : `No ${this.config.title.replace(/ Master$/i, '').toLowerCase()} records yet.`,
  );

  readonly showEmptyState = computed(
    () => !this.isLoading() && !this.loadError() && this.tableData().length === 0,
  );

  // ── Add / Edit / View ────────────────────────────────────────────────────

  get canWrite(): boolean {
    return !this.config.readOnly;
  }

  onAddNew(): void {
    const fields = this.config.fields.filter((f) => !f.omitOnCreate);
    this.resolveFieldOptions(fields, {}, 'create').then((descriptors) => {
      const dialogRef = this.dialog.open(EditModelComponent, {
        width: this.dialogWidth,
        data: {
          title: `Add New ${this.singular}`,
          formFields: descriptors,
          formData: defaultFormData(fields),
          allData: this.tableData(),
          duplicateCheckFields: this.config.duplicateCheckFields ?? [],
        },
      });

      this.wireCascades(dialogRef, fields);

      dialogRef
        .afterClosed()
        .pipe(take(1))
        .subscribe((result) => {
          if (!result) return;
          this.withSaveConfirmation(result, 'create', () => this.create(result));
        });
    });
  }

  onEditRow(row: any): void {
    const formData = this.config.toFormData(row);
    // Child options must exist before the dialog opens, or the record's current
    // value has no matching option and renders blank.
    this.resolveFieldOptions(this.config.fields, formData, 'edit').then((descriptors) => {
      const dialogRef = this.dialog.open(EditModelComponent, {
        width: this.dialogWidth,
        data: {
          title: `Edit ${this.singular}`,
          formFields: descriptors,
          formData: { ...formData, id: row.id },
          allData: this.tableData(),
          duplicateCheckFields: this.config.duplicateCheckFields ?? [],
        },
      });

      this.wireCascades(dialogRef, this.config.fields);

      dialogRef
        .afterClosed()
        .pipe(take(1))
        .subscribe((result) => {
          if (!result) return;
          this.withSaveConfirmation(result, 'edit', () => this.update(row.id, result));
        });
    });
  }

  /** A wider dialog once the form is tabbed, since those forms are large. */
  private get dialogWidth(): string {
    return this.config.fields.some((f) => f.tab) ? '760px' : '640px';
  }

  /**
   * Some saves have a side effect worth warning about — setting a new current
   * academic year, or renaming a role the app matches on by name.
   */
  private withSaveConfirmation(
    result: any,
    mode: 'create' | 'edit',
    save: () => void,
  ): void {
    const message = this.config.confirmBeforeSave?.(result, mode) ?? null;
    if (!message) {
      save();
      return;
    }

    this.confirm('Please confirm', message, 'Continue')
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (confirmed) save();
      });
  }

  onViewRow(row: any): void {
    const formData = this.config.toFormData(row);
    this.resolveFieldOptions(this.config.fields, formData, 'edit').then((descriptors) => {
      this.dialog.open(EditModelComponent, {
        width: this.dialogWidth,
        data: {
          title: `View ${this.singular}`,
          formFields: descriptors.map((f) => ({ ...f, disabled: true })),
          formData,
          allData: [],
          duplicateCheckFields: [],
          viewMode: true,
          disableSaveButton: true,
        },
      });
    });
  }

  onDeleteRow(row: any): void {
    this.confirm(
      'Confirm Deletion',
      `Delete "${this.config.entityLabel(row)}"? This is a soft delete — the record is ` +
        'hidden from lists but kept in the database, so nothing that references it breaks.',
      'Delete',
    )
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        const spinner = this.showSpinner();
        this.crud
          .remove(row.id)
          .pipe(take(1))
          .subscribe({
            next: () => {
              spinner.close();
              this.afterWrite(`${this.config.entityLabel(row)} deleted.`);
            },
            error: (error: unknown) => {
              spinner.close();
              this.showError(error, 'Delete failed.');
            },
          });
      });
  }

  private create(result: Record<string, any>): void {
    const spinner = this.showSpinner();
    this.crud
      .create(this.config.toCreate(result))
      .pipe(take(1))
      .subscribe({
        next: () => {
          spinner.close();
          this.afterWrite(`${this.singular} created.`);
        },
        error: (error: unknown) => {
          spinner.close();
          this.showError(error, 'Create failed.');
        },
      });
  }

  private update(id: number, result: Record<string, any>): void {
    const spinner = this.showSpinner();
    this.crud
      .update(id, this.config.toUpdate(result))
      .pipe(take(1))
      .subscribe({
        next: () => {
          spinner.close();
          this.afterWrite(`${this.singular} updated.`);
        },
        error: (error: unknown) => {
          spinner.close();
          this.showError(error, 'Update failed.');
        },
      });
  }

  /** Re-read after every write; never patch local state. */
  private afterWrite(message: string): void {
    this.lookups.invalidate(this.config.resource);
    this.loadRootLookups();
    this.loadData(this.filter.currentPage);
    this.showSuccess(message);
  }

  // ── Dialog field options and cascades ────────────────────────────────────

  /**
   * Turns field configs into EditModelComponent descriptors, resolving each
   * `optionsFrom` lookup — including a cascading child, whose parent value is
   * read from the record being edited.
   */
  private async resolveFieldOptions(
    fields: MasterFieldConfig[],
    formData: Record<string, unknown>,
    mode: 'create' | 'edit' = 'edit',
  ): Promise<any[]> {
    const descriptors: any[] = [];
    const isCreate = mode === 'create';

    for (const field of fields) {
      const descriptor: any = {
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required || (isCreate && field.requiredOnCreate),
        // An immutable foreign key stays visible for context but cannot be changed.
        disabled: !isCreate && field.readonlyOnEdit,
        maxLength: field.maxLength,
        minLength: field.minLength,
        pattern: field.pattern,
        value: field.value,
        tab: field.tab,
        hint: field.hint,
        onLabel: field.onLabel,
        offLabel: field.offLabel,
        visibleWhen: field.visibleWhen
          ? { field: field.visibleWhen.field, equals: field.visibleWhen.equals }
          : undefined,
      };

      if (field.optionsList) {
        descriptor.optionsList = field.optionsList;
      } else if (field.optionsFrom) {
        const parentId = field.dependsOn
          ? (formData[field.dependsOn] as number | null | undefined) ?? null
          : null;
        descriptor.optionsList = await this.fetchLookup(field.optionsFrom, parentId);
      }

      descriptors.push(descriptor);
    }

    return descriptors;
  }

  private fetchLookup(key: string, parentId: number | null): Promise<DropdownModel[]> {
    const lookupConfig: LookupConfig | undefined = this.config.lookups?.[key];
    if (!lookupConfig) {
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      this.lookups
        .options(lookupConfig, parentId)
        .pipe(take(1))
        .subscribe({
          next: (options) => resolve(options),
          error: () => resolve([]),
        });
    });
  }

  /**
   * Reloads a child dropdown whenever its parent changes inside the dialog.
   * Subscribed via afterOpened() for both add and edit so the two paths behave
   * identically.
   */
  private wireCascades(
    dialogRef: MatDialogRef<EditModelComponent>,
    fields: MasterFieldConfig[],
  ): void {
    const children = fields.filter((f) => f.dependsOn && f.optionsFrom);
    if (!children.length) {
      return;
    }

    dialogRef
      .afterOpened()
      .pipe(take(1))
      .subscribe(() => {
        dialogRef.componentInstance.fieldValueChanged
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ fieldName, value }) => {
            for (const child of children) {
              if (child.dependsOn !== fieldName) continue;

              const parentId = optionValue(value) as number | null;
              this.fetchLookup(child.optionsFrom!, parentId).then((options) => {
                // updateFieldOptions also resets the child, clearing a now
                // inconsistent selection.
                dialogRef.componentInstance.updateFieldOptions(child.name, options);
              });
            }
          });
      });
  }

  // ── Export ───────────────────────────────────────────────────────────────

  onDownloadExcel(): void {
    if (this.totalCount() === 0) {
      this.showWarning('There is nothing to export.');
      return;
    }

    const spinner = this.showSpinner();
    const query = this.buildQuery(1);
    query['PageSize'] = this.totalCount();

    this.crud
      .list(query)
      .pipe(take(1))
      .subscribe({
        next: (page) => {
          spinner.close();
          this.exportToCsv((page?.Items ?? []).map((item) => this.config.toRow(item)));
        },
        error: (error: unknown) => {
          spinner.close();
          this.showError(error, 'Export failed.');
        },
      });
  }

  private exportToCsv(rows: any[]): void {
    const columns = this.config.columns;
    const header = columns.map((c) => escapeCsv(c.label)).join(',');
    const body = rows
      .map((row) => columns.map((c) => escapeCsv(row[c.key])).join(','))
      .join('\n');

    // The BOM keeps Excel from mangling non-ASCII names.
    const blob = new Blob([`﻿${header}\n${body}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.config.exportFileName ?? this.config.resource}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

/** Filter and dialog dropdowns emit the whole option object. */
function optionValue(value: unknown): unknown {
  if (value && typeof value === 'object' && 'value' in (value as DropdownModel)) {
    return (value as DropdownModel).value;
  }
  return value ?? null;
}

function defaultFormData(fields: MasterFieldConfig[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.value !== undefined) {
      data[field.name] = field.value;
    }
  }
  return data;
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
