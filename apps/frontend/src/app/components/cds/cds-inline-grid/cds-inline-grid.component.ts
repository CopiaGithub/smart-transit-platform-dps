import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DropdownModel } from '../../constants';
import { CdsInlineMasterCellComponent } from '../cds-inline-master-cell/cds-inline-master-cell.component';
import {
  InlineGridColumn,
  InlineGridRow,
} from './cds-inline-grid.types';

let nextRowId = 1;

@Component({
  selector: 'cds-inline-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    CdsInlineMasterCellComponent,
  ],
  templateUrl: './cds-inline-grid.component.html',
  styleUrls: ['./cds-inline-grid.component.css'],
})
export class CdsInlineGridComponent implements OnChanges {
  @Input() columns: InlineGridColumn[] = [];
  @Input() data: InlineGridRow[] = [];
  @Input() readonly = false;
  @Input() allowAdd = true;
  @Input() showActions = true;
  @Input() showToolbar = true;
  @Input() addRowLabel = 'New record';
  @Input() emptyMessage = 'No records yet. Click "New record" to add one.';
  @Input() defaultNewRow: Partial<InlineGridRow> = {};
  /** Master dropdown options keyed by masterKey on columns (dealer, region, …) */
  @Input() masterOptions: Record<string, DropdownModel[]> = {};

  @Output() dataChange = new EventEmitter<InlineGridRow[]>();
  @Output() rowAdded = new EventEmitter<InlineGridRow>();
  @Output() rowDeleted = new EventEmitter<InlineGridRow>();
  @Output() cellChanged = new EventEmitter<{
    row: InlineGridRow;
    key: string;
    value: unknown;
  }>();

  rows: InlineGridRow[] = [];
  private dirtyIds = new Set<string | number>();
  private snapshot = new Map<string | number, string>();

  get gridTemplateColumns(): string {
    const parts = this.columns.map((col) => {
      if (col.width) return col.width;
      if (
        col.type === 'masterSelect' ||
        col.type === 'masterAutocomplete'
      ) {
        return '10rem';
      }
      return 'minmax(0, 1fr)';
    });
    if (this.showActions) {
      parts.push('5rem');
    }
    return parts.join(' ');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.rows = (this.data ?? []).map((r) => ({ ...r }));
      this.captureSnapshot();
      this.dirtyIds.clear();
    }
  }

  trackById(_index: number, row: InlineGridRow): string | number {
    return row.id;
  }

  displayValue(row: InlineGridRow, col: InlineGridColumn): string {
    const val = row[col.key];
    if (val == null || val === '') return '—';
    if (
      (col.type === 'masterSelect' || col.type === 'masterAutocomplete') &&
      typeof val === 'object' &&
      val !== null &&
      'name' in val
    ) {
      return String((val as DropdownModel).name);
    }
    if (col.type === 'select' && col.options) {
      const match = col.options.find((o) => o.value === val);
      return match?.label ?? String(val);
    }
    return String(val);
  }

  getMasterOptions(col: InlineGridColumn): DropdownModel[] {
    if (!col.masterKey) return [];
    return this.masterOptions[col.masterKey] ?? [];
  }

  getMasterMode(col: InlineGridColumn): 'select' | 'autocomplete' {
    return 'autocomplete';
  }

  /** Static `options` are {value,label}; the cell speaks {name,value}. */
  getSelectOptions(col: InlineGridColumn): DropdownModel[] {
    return (col.options ?? []).map((o) => ({ name: o.label, value: o.value }));
  }

  asSelectValue(row: InlineGridRow, col: InlineGridColumn): DropdownModel | null {
    const val = row[col.key];
    if (val == null || val === '') return null;
    const match = (col.options ?? []).find((o) => o.value === val);
    return match ? { name: match.label, value: match.value } : null;
  }

  /** A `select` column keeps its scalar value — unwrap what the cell emits. */
  onSelectCellChange(
    row: InlineGridRow,
    key: string,
    value: DropdownModel | null,
  ): void {
    this.onCellChange(row, key, value?.value ?? null);
  }

  asDropdownValue(row: InlineGridRow, key: string): DropdownModel | null {
    const val = row[key];
    if (val && typeof val === 'object' && 'name' in val && 'value' in val) {
      return val as DropdownModel;
    }
    return null;
  }

  onMasterCellChange(
    row: InlineGridRow,
    key: string,
    value: DropdownModel | null,
  ): void {
    this.onCellChange(row, key, value);
  }

  onCellChange(row: InlineGridRow, key: string, value: unknown): void {
    row[key] = value;
    const serialized = JSON.stringify(row);
    const original = this.snapshot.get(row.id);
    if (original !== serialized) {
      this.dirtyIds.add(row.id);
    } else {
      this.dirtyIds.delete(row.id);
    }
    this.cellChanged.emit({ row, key, value });
    this.emitChange();
  }

  addRow(): void {
    const id = `new-${nextRowId++}`;
    const row: InlineGridRow = {
      id,
      _isNew: true,
      ...this.buildEmptyRow(),
      ...this.defaultNewRow,
    };
    this.rows = [...this.rows, row];
    this.snapshot.set(id, JSON.stringify(row));
    this.rowAdded.emit(row);
    this.emitChange();
  }

  deleteRow(row: InlineGridRow): void {
    this.rows = this.rows.filter((r) => r.id !== row.id);
    this.dirtyIds.delete(row.id);
    this.snapshot.delete(row.id);
    this.rowDeleted.emit(row);
    this.emitChange();
  }

  isDirty(row: InlineGridRow): boolean {
    return this.dirtyIds.has(row.id) || !!row['_isNew'];
  }

  private buildEmptyRow(): InlineGridRow {
    const row: InlineGridRow = { id: '' };
    for (const col of this.columns) {
      if (col.key === 'id') continue;
      if (
        col.type === 'number' ||
        col.type === 'masterSelect' ||
        col.type === 'masterAutocomplete'
      ) {
        row[col.key] = null;
      } else {
        row[col.key] = '';
      }
    }
    return row;
  }

  private captureSnapshot(): void {
    this.snapshot.clear();
    for (const row of this.rows) {
      this.snapshot.set(row.id, JSON.stringify(row));
    }
  }

  private emitChange(): void {
    this.dataChange.emit(
      this.rows.map((row) => {
        const { _isNew, ...rest } = row;
        return rest;
      }),
    );
  }
}
