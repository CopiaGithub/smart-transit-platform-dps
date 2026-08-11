import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  FormArray,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CdsAutocompleteDropdownComponent } from '../cds-autocomplete-dropdown/cds-autocomplete-dropdown.component';
import { DropdownModel } from '../../constants';
import { InlineGridColumn } from '../cds-inline-grid/cds-inline-grid.types';

@Component({
  selector: 'cds-inline-form-grid',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    CdsAutocompleteDropdownComponent,
  ],
  templateUrl: './cds-inline-form-grid.component.html',
  styleUrl: './cds-inline-form-grid.component.css',
})
export class CdsInlineFormGridComponent {
  @Input({ required: true }) formArray!: FormArray<FormGroup>;
  @Input() columns: InlineGridColumn[] = [];
  @Input() masterOptions: Record<string, DropdownModel[]> = {};
  @Input() allowAdd = true;
  @Input() showActions = true;
  @Input() showToolbar = true;
  /** When true, columns stretch to fill the available width (no trailing gap). */
  @Input() fillWidth = false;
  @Input() addRowLabel = 'New record';
  @Input() emptyMessage = 'No records yet. Click "New record" to add one.';

  @Output() addRow = new EventEmitter<void>();
  @Output() removeRow = new EventEmitter<number>();

  get gridTemplateColumns(): string {
    const parts = this.columns.map((col) => {
      const width = this.columnWidth(col);
      return this.fillWidth ? `minmax(${width}, 1fr)` : width;
    });
    if (this.showActions) {
      parts.push('5.5rem');
    }
    return parts.join(' ');
  }

  /** Minimum width before horizontal scroll kicks in on wide steps. */
  get gridMinWidth(): string {
    const parts = this.columns.map((col) => this.columnWidth(col));
    if (this.showActions) {
      parts.push('5.5rem');
    }
    const totalRem = parts.reduce(
      (sum, width) => sum + (parseFloat(width) || 10),
      0,
    );
    return `${totalRem}rem`;
  }

  private columnWidth(col: InlineGridColumn): string {
    if (col.width) {
      return col.width;
    }
    if (
      col.type === 'masterSelect' ||
      col.type === 'masterAutocomplete'
    ) {
      return '11rem';
    }
    if (col.type === 'number' || col.type === 'readonly') {
      return '8rem';
    }
    if (col.type === 'date') {
      return '9rem';
    }
    return '10rem';
  }

  rowControls(): FormGroup[] {
    return this.formArray?.controls ?? [];
  }

  trackByIndex(index: number): number {
    return index;
  }

  getMasterOptions(col: InlineGridColumn): DropdownModel[] {
    if (!col.masterKey) return [];
    return this.masterOptions[col.masterKey] ?? [];
  }

  onAddRow(): void {
    this.addRow.emit();
  }

  onRemoveRow(index: number): void {
    this.removeRow.emit(index);
  }

  isRowDirty(row: FormGroup): boolean {
    return row.dirty;
  }
}
