import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  Input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DropdownModel } from '../../constants';

/**
 * Reusable searchable multi-select dropdown.
 *
 * Binds via `formControlName` / `ngModel`; the control value is an array of the
 * selected option `value`s (e.g. number[]). Suitable for long option lists
 * (20-50+) thanks to the built-in type-ahead filter.
 */
@Component({
  selector: 'cds-multi-autocomplete',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './cds-multi-autocomplete.component.html',
  styleUrl: './cds-multi-autocomplete.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsMultiAutocompleteComponent),
      multi: true,
    },
  ],
})
export class CdsMultiAutocompleteComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Search and select…';
  @Input() required = false;
  @Input() set options(value: DropdownModel[]) {
    this._options.set(value ?? []);
  }
  get options(): DropdownModel[] {
    return this._options();
  }

  private _options = signal<DropdownModel[]>([]);
  selected = signal<any[]>([]);
  query = signal<string>('');
  open = signal<boolean>(false);
  disabled = signal<boolean>(false);

  private onChange: (value: any[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private host: ElementRef) {}

  /** Options matching the current query. */
  get filteredOptions(): DropdownModel[] {
    const q = this.query().trim().toLowerCase();
    if (!q) return this._options();
    return this._options().filter((o) =>
      String(o.name).toLowerCase().includes(q),
    );
  }

  /** Selected options, for rendering chips. */
  get selectedOptions(): DropdownModel[] {
    const set = new Set(this.selected());
    return this._options().filter((o) => set.has(o.value));
  }

  isSelected(value: any): boolean {
    return this.selected().includes(value);
  }

  togglePanel(): void {
    if (this.disabled()) return;
    this.open.update((v) => !v);
    if (this.open()) this.onTouched();
  }

  openPanel(): void {
    if (this.disabled()) return;
    this.open.set(true);
  }

  onQueryInput(value: string): void {
    this.query.set(value);
    this.open.set(true);
  }

  toggleOption(value: any, event?: Event): void {
    event?.stopPropagation();
    if (this.disabled()) return;

    const current = [...this.selected()];
    const idx = current.indexOf(value);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(value);

    this.commit(current);
  }

  removeChip(value: any, event?: Event): void {
    event?.stopPropagation();
    if (this.disabled()) return;
    this.commit(this.selected().filter((v) => v !== value));
  }

  clearAll(event?: Event): void {
    event?.stopPropagation();
    if (this.disabled() || !this.selected().length) return;
    this.commit([]);
  }

  private commit(values: any[]): void {
    this.selected.set(values);
    this.onChange(values);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }

  // ---- ControlValueAccessor ----
  writeValue(value: any[] | null): void {
    this.selected.set(Array.isArray(value) ? [...value] : []);
  }

  registerOnChange(fn: (value: any[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) this.open.set(false);
  }
}
