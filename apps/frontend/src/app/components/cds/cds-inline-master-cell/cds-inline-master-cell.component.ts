import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModel } from '../../constants';

@Component({
  selector: 'cds-inline-master-cell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cds-inline-master-cell.component.html',
  styleUrl: './cds-inline-master-cell.component.css',
})
export class CdsInlineMasterCellComponent implements OnChanges {
  @Input() mode: 'select' | 'autocomplete' = 'autocomplete';
  @Input() options: DropdownModel[] = [];
  @Input() value: DropdownModel | null = null;
  @Input() placeholder = 'Select';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<DropdownModel | null>();

  searchText = '';
  showDropdown = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.syncSearchFromValue();
    }
  }

  get selectedId(): string | number | null {
    return this.value?.value ?? null;
  }

  onSelectChange(raw: string | number | null): void {
    if (raw == null || raw === '') {
      this.emit(null);
      return;
    }
    const match = this.options.find((o) => o.value == raw);
    this.emit(match ?? null);
  }

  onSearchInput(text: string): void {
    this.searchText = text;
    if (!this.value || this.value.name !== text) {
      this.value = null;
      this.valueChange.emit(null);
    }
    this.showDropdown = true;
  }

  onFocus(): void {
    this.syncSearchFromValue();
    this.showDropdown = true;
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown = false;
      if (this.value) {
        this.searchText = this.value.name;
      }
    }, 150);
  }

  pickOption(option: DropdownModel): void {
    this.emit(option);
    this.searchText = option.name;
    this.showDropdown = false;
  }

  get filteredOptions(): DropdownModel[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.options.slice(0, 80);
    return this.options
      .filter((o) => o.name.toLowerCase().includes(q))
      .slice(0, 80);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.showDropdown = false;
    }
  }

  private emit(val: DropdownModel | null): void {
    this.value = val;
    this.valueChange.emit(val);
  }

  private syncSearchFromValue(): void {
    this.searchText = this.value?.name ?? '';
  }
}
