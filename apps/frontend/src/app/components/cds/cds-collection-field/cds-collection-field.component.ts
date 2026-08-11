import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DropdownModel } from '../../constants';
import { CdsAutocompleteDropdownComponent } from '../cds-autocomplete-dropdown/cds-autocomplete-dropdown.component';
import { CdsLabelComponent } from '../cds-label/cds-label.component';

export type CollectionColumnType =
  | 'dropdown'
  | 'text'
  | 'number'
  | 'toggle'
  /** Boolean that only one row may hold — picking it clears every other row. */
  | 'radio';

export interface CollectionColumn {
  key: string;
  label: string;
  type: CollectionColumnType;
  /** Resolved by the caller; `optionsFrom` is a page-config concern. */
  optionsList?: DropdownModel[];
  required?: boolean;
  /** Grid track size, e.g. '2fr' or '6rem'. Defaults to an equal share. */
  width?: string;
  /** Value a freshly added row starts with. */
  value?: unknown;
}

type Row = Record<string, unknown>;

/**
 * Edits a list of child records inside a parent form — the student's parents, and
 * anything else shaped like it.
 *
 * The rows are a real FormArray rather than a plain array in a signal, because the
 * cell editors are the ordinary CDS controls and those resolve their FormControl
 * through NgControl. An ngModel-driven grid would leave
 * cds-autocomplete-dropdown without a control and it would render nothing.
 */
@Component({
  selector: 'cds-collection-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    CdsLabelComponent,
    CdsAutocompleteDropdownComponent,
  ],
  templateUrl: './cds-collection-field.component.html',
  styleUrl: './cds-collection-field.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsCollectionFieldComponent),
      multi: true,
    },
  ],
})
export class CdsCollectionFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() columns: CollectionColumn[] = [];
  @Input() addRowLabel = 'Add row';
  @Input() emptyText = 'Nothing added yet.';
  @Input() required = false;

  readonly rows = new FormArray<FormGroup>([]);
  // Zoneless: the template reads this, so it has to be a signal or the button
  // never greys out.
  readonly isDisabled = signal(false);

  private onChange: (value: Row[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  get gridTemplateColumns(): string {
    const parts = this.columns.map((column) => column.width ?? 'minmax(0, 1fr)');
    parts.push('2.5rem'); // the remove button
    return parts.join(' ');
  }

  writeValue(value: unknown): void {
    const incoming = Array.isArray(value) ? (value as Row[]) : [];

    this.rows.clear({ emitEvent: false });
    for (const row of incoming) {
      this.rows.push(this.buildRow(row), { emitEvent: false });
    }
    this.rows.updateValueAndValidity({ emitEvent: false });
  }

  registerOnChange(fn: (value: Row[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
    if (isDisabled) {
      this.rows.disable({ emitEvent: false });
    } else {
      this.rows.enable({ emitEvent: false });
    }
  }

  rowAt(index: number): FormGroup {
    return this.rows.at(index);
  }

  addRow(): void {
    if (this.isDisabled()) return;

    const row = this.buildRow({});
    // The first row added is the obvious primary contact; later ones are not, or
    // adding a second row would silently steal the flag from the first.
    if (this.rows.length === 0) {
      for (const column of this.columns) {
        if (column.type === 'radio') {
          row.get(column.key)?.setValue(true, { emitEvent: false });
        }
      }
    }

    this.rows.push(row);
    this.publish();
  }

  removeRow(index: number): void {
    if (this.isDisabled()) return;

    const removed = this.rows.at(index);
    this.rows.removeAt(index);

    // Removing the row that held an exclusive flag would leave the list with none,
    // so hand it to whatever is now first.
    for (const column of this.columns) {
      if (column.type === 'radio' && removed?.get(column.key)?.value === true) {
        this.rows.at(0)?.get(column.key)?.setValue(true, { emitEvent: false });
      }
    }

    this.onTouched();
    this.publish();
  }

  /** Exclusive across rows: selecting one clears the rest. */
  selectExclusive(column: CollectionColumn, index: number): void {
    if (this.isDisabled()) return;

    this.rows.controls.forEach((row, i) => {
      row.get(column.key)?.setValue(i === index, { emitEvent: false });
    });
    this.onTouched();
    this.publish();
  }

  onCellChange(): void {
    this.onTouched();
    this.publish();
  }

  trackByIndex(index: number): number {
    return index;
  }

  private buildRow(source: Row): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const column of this.columns) {
      // A boolean column falls back to false, never null: a checkbox bound to null
      // looks unchecked but puts null on the wire, and the server's `bool?` fields
      // read that as "not supplied" rather than "off".
      const fallback =
        column.value ?? (column.type === 'toggle' || column.type === 'radio' ? false : null);
      const value = source[column.key] !== undefined ? source[column.key] : fallback;
      controls[column.key] = new FormControl(value);
    }

    // Carried through untouched so the caller can tell an existing record from a
    // newly added one when it comes to saving.
    for (const key of Object.keys(source)) {
      if (!(key in controls)) {
        controls[key] = new FormControl(source[key]);
      }
    }

    return new FormGroup(controls);
  }

  private publish(): void {
    this.onChange(this.rows.getRawValue() as Row[]);
  }
}
