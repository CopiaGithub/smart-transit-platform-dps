import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, take } from 'rxjs';

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
  /** Mirrors filter.currentPage for the table, which is rebuilt on every load. */
  readonly currentPage = signal(1);
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

      // Nothing here refetches the list. Filters are applied only by the Search
      // button (or Enter, which submits the same form) — typing a term or picking
      // a dropdown value used to fire its own request, which meant a half-built
      // filter set hitting the server and the grid changing under the user.
      if (filterConfig.type === 'search') {
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
    this.currentPage.set(pageNumber);
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
          this.tableData.set(
            (page?.Items ?? []).map((item) => this.decorate(this.config.toRow(item))),
          );
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
  /** Public: the template names the Add button after it ("Add Display"). */
  get singular(): string {
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
    this.resolveFieldOptions(fields, {}, 'create').then(async (descriptors) => {
      const collections = await this.loadCollections(null);
      const dialogRef = this.dialog.open(EditModelComponent, {
        width: this.dialogWidth,
        data: {
          title: `Add ${this.singular}`,
          formFields: descriptors,
          formData: { ...defaultFormData(fields), ...collections },
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
    this.resolveFieldOptions(this.config.fields, formData, 'edit').then(async (descriptors) => {
      let collections: Record<string, unknown>;
      try {
        collections = await this.loadCollections(row.id);
      } catch (error: unknown) {
        // Opening with an empty list would look like "this record has none", and
        // saving would then re-post every existing row as a duplicate.
        this.showError(error, 'Could not load the linked records for this row.');
        return;
      }

      const dialogRef = this.dialog.open(EditModelComponent, {
        width: this.dialogWidth,
        data: {
          title: `Edit ${this.singular}`,
          formFields: descriptors,
          formData: { ...formData, ...collections, id: row.id },
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
    // A collection is a grid of controls on one line; 760px squeezes it to the
    // point the dropdowns cannot show a name.
    if (this.config.fields.some((f) => f.type === 'collection')) {
      return '960px';
    }
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
    this.resolveFieldOptions(this.config.fields, formData, 'edit').then(async (descriptors) => {
      // A failed load is not worth blocking a read-only view: show what loaded.
      const collections = await this.loadCollections(row.id).catch(() => ({}));

      this.dialog.open(EditModelComponent, {
        width: this.dialogWidth,
        data: {
          title: `View ${this.singular}`,
          formFields: descriptors.map((f) => ({ ...f, disabled: true })),
          formData: { ...formData, ...collections },
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
        next: (created: any) => {
          // Linked rows can only be posted now — they need the id the server has
          // just minted. See finishWrite for what happens when one of them fails.
          void this.finishWrite(
            spinner,
            created?.Id ?? created?.id ?? null,
            result,
            `${this.singular} created.`,
          );
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
          void this.finishWrite(spinner, id, result, `${this.singular} updated.`);
        },
        error: (error: unknown) => {
          spinner.close();
          this.showError(error, 'Update failed.');
        },
      });
  }

  /** Re-read after every write; never patch local state. */
  // ── Custom row action ────────────────────────────────────────────────────

  /** TableComponent reads per-row `showCustomAction` to hide the button on a row. */
  private decorate(row: any): any {
    const visibleFor = this.config.rowAction?.visibleFor;
    return visibleFor ? { ...row, showCustomAction: visibleFor(row) } : row;
  }

  /**
   * Opens the action's dialog, then posts to its endpoint. Mirrors onEditRow,
   * except the body and path come from the action rather than from toUpdate.
   */
  onRowAction(row: any): void {
    const action = this.config.rowAction;
    if (!action) {
      return;
    }

    const formData = action.toFormData?.(row) ?? {};
    this.resolveFieldOptions(action.fields, formData, 'create').then((descriptors) => {
      const dialogRef = this.dialog.open(EditModelComponent, {
        width: '520px',
        data: {
          title: action.title(row),
          formFields: descriptors,
          formData,
          allData: [],
          duplicateCheckFields: [],
          saveButtonText: action.saveButtonText ?? action.label,
        },
      });

      dialogRef
        .afterClosed()
        .pipe(take(1))
        .subscribe((result) => {
          if (!result) {
            return;
          }

          const message = action.confirmBefore?.(row, result) ?? null;
          if (!message) {
            this.runRowAction(row, result);
            return;
          }

          this.confirm('Please confirm', message, 'Continue')
            .pipe(take(1))
            .subscribe((confirmed) => {
              if (confirmed) {
                this.runRowAction(row, result);
              }
            });
        });
    });
  }

  private runRowAction(row: any, result: any): void {
    const action = this.config.rowAction!;
    const { path, body } = action.request(row, result);
    const spinner = this.showSpinner();

    this.api
      .post<unknown>(path, body)
      .pipe(take(1))
      .subscribe({
        next: () => {
          spinner.close();
          this.afterWrite(action.successMessage ?? `${action.label} completed.`);
        },
        error: (error: unknown) => {
          spinner.close();
          this.showError(error, `${action.label} failed.`);
        },
      });
  }

  // ── Collections (linked child records) ───────────────────────────────────

  /**
   * What the server said the rows were when the dialog opened. The diff on save
   * is against this, not against the form's own starting state, so a row the user
   * deleted can be told apart from one that was never there.
   */
  private collectionSnapshot: Record<string, Record<string, unknown>[]> = {};

  private get collectionFields(): MasterFieldConfig[] {
    return this.config.fields.filter((f) => f.type === 'collection' && f.collection);
  }

  /**
   * Rows for the dialog to start from. A create has no parent id yet, so it starts
   * empty and everything is posted after the parent exists.
   */
  private async loadCollections(parentId: number | null): Promise<Record<string, unknown>> {
    const formData: Record<string, unknown> = {};
    this.collectionSnapshot = {};

    for (const field of this.collectionFields) {
      const rows =
        parentId == null ? [] : await this.fetchCollectionRows(field, parentId);
      formData[field.name] = rows;
      this.collectionSnapshot[field.name] = rows;
    }

    return formData;
  }

  private fetchCollectionRows(
    field: MasterFieldConfig,
    parentId: number,
  ): Promise<Record<string, unknown>[]> {
    const sync = field.collection!;
    return new Promise((resolve, reject) => {
      this.api
        .get<any[]>(sync.load(parentId))
        .pipe(take(1))
        .subscribe({
          next: (items) => resolve((items ?? []).map((item) => sync.toRow(item))),
          // Never resolve to [] here. An empty list reads as "this record has no
          // parents", and saving would then re-post every one of them.
          error: (error: unknown) => reject(error),
        });
    });
  }

  /**
   * Applies the dialog's rows to the server. Returns one message per row that
   * failed; the parent itself is already saved by this point, so a failure here
   * is partial, and the caller has to say so rather than claim success.
   */
  private async syncCollections(
    parentId: number,
    result: Record<string, any>,
  ): Promise<string[]> {
    const failures: string[] = [];

    for (const field of this.collectionFields) {
      const sync = field.collection!;
      const submitted = Array.isArray(result[field.name])
        ? (result[field.name] as Record<string, unknown>[])
        : [];
      // A row the user added and left blank is not an error, it is a no-op.
      const rows = submitted.filter((row) => sync.isComplete(row));
      const before = this.collectionSnapshot[field.name] ?? [];
      const keptIds = new Set(
        rows.map((row) => sync.rowId(row)).filter((id): id is number => id != null),
      );

      // Removals go first: they free the unique (parent, child) slot, so a row
      // that was deleted and re-added in one sitting does not collide with itself.
      if (sync.remove) {
        for (const old of before) {
          const id = sync.rowId(old);
          if (id == null || keptIds.has(id)) continue;

          const error = await this.sendCollectionRequest(() =>
            this.api.delete<unknown>(sync.remove!(id)),
          );
          if (error) failures.push(`Could not remove ${sync.rowLabel(old)} — ${error}`);
        }
      }

      for (const row of rows) {
        const id = sync.rowId(row);

        if (id == null) {
          const { path, body } = sync.create(parentId, row);
          const error = await this.sendCollectionRequest(() =>
            this.api.post<unknown>(path, body),
          );
          if (error) failures.push(`Could not add ${sync.rowLabel(row)} — ${error}`);
        } else if (sync.update) {
          const { path, body } = sync.update(id, row);
          const error = await this.sendCollectionRequest(() =>
            this.api.patch<unknown>(path, body),
          );
          if (error) failures.push(`Could not update ${sync.rowLabel(row)} — ${error}`);
        }
      }
    }

    return failures;
  }

  /** Resolves to the server's message on failure, or null on success. */
  private sendCollectionRequest(run: () => Observable<unknown>): Promise<string | null> {
    return new Promise((resolve) => {
      run()
        .pipe(take(1))
        .subscribe({
          next: () => resolve(null),
          error: (error: unknown) => resolve(resolveErrorMessage(error, 'the server refused it')),
        });
    });
  }

  /**
   * Closes out a write: sync the collections, then report honestly. The parent is
   * saved either way, so a row failure is a warning, not an error — telling the
   * user it failed outright would send them back to re-enter a record that exists.
   */
  private async finishWrite(
    spinner: MatDialogRef<unknown>,
    parentId: number | null,
    result: Record<string, any>,
    successMessage: string,
  ): Promise<void> {
    let failures: string[] = [];

    if (parentId != null && this.collectionFields.length) {
      failures = await this.syncCollections(parentId, result);
    }

    spinner.close();

    if (failures.length) {
      this.showWarning(`${successMessage} But: ${failures.join(' ')}`);
      this.lookups.invalidate(this.config.resource);
      this.loadRootLookups();
      this.loadData(this.filter.currentPage);
      return;
    }

    this.afterWrite(successMessage);
  }

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
        accept: field.accept,
        maxFileSizeMb: field.maxFileSizeMb,
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

      if (field.type === 'collection') {
        descriptor.addRowLabel = field.addRowLabel;
        descriptor.emptyText = field.emptyText;
        descriptor.columns = [];
        for (const column of field.columns ?? []) {
          descriptor.columns.push({
            ...column,
            optionsList: column.optionsList ?? (
              column.optionsFrom ? await this.fetchLookup(column.optionsFrom, null) : []
            ),
          });
        }
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
