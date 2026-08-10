import {
Component,
forwardRef,
Input,
ViewChild,
ElementRef,
HostListener,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { DropdownModel } from '../../../constants';
import { ControlValueAccessorDirective } from '../../../directive';
import { CommonModule } from '@angular/common';
import { CdsLabelComponent } from '../../cds-label/cds-label.component';
import { ValidationErrorsComponent } from '../../../validation-errors/validation-errors.component';

@Component({
  selector: 'app-cds-multi-select-dd',
  standalone: true,
  templateUrl: './cds-multi-select-dd.component.html',
  styleUrls: ['./cds-multi-select-dd.component.css'],
  imports: [CommonModule, CdsLabelComponent, ValidationErrorsComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsMultiSelectDdComponent),
      multi: true,
    },
  ],
})
export class CdsMultiSelectDdComponent
  extends ControlValueAccessorDirective<DropdownModel[]>
{
  @Input() label!: string;
  @Input() placeholder!: string;
  @Input() customclasses!: string;
  @Input() customlabel!: string;
  @Input() isAstRequired = true;

  // ✅ FIX: use Input instead of model()
  @Input() optionsList: DropdownModel[] = [];

  @ViewChild('dropdownRef') dropdownRef!: ElementRef;

  dropdownOpen = false;
  selectedOptions: DropdownModel[] = [];

  toggleDropdown(event: Event) {
    event.stopPropagation();
    if (this.control?.disabled) return;
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: MouseEvent) {
    if (
      this.dropdownOpen &&
      this.dropdownRef &&
      !this.dropdownRef.nativeElement.contains(event.target)
    ) {
      this.dropdownOpen = false;
    }
  }

  // ✅ Select single
  toggleItem(option: DropdownModel, event: Event) {
    event.stopPropagation();

    const exists = this.selectedOptions.some(
      (x) => x.value === option.value
    );

    if (exists) {
      this.selectedOptions = this.selectedOptions.filter(
        (x) => x.value !== option.value
      );
    } else {
      this.selectedOptions = [...this.selectedOptions, option];
    }

    this._changed(this.selectedOptions);
  }

  isSelected(option: DropdownModel): boolean {
    return this.selectedOptions.some((x) => x.value === option.value);
  }

  // 🔥 SELECT ALL
  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedOptions = [...this.optionsList];
    } else {
      this.selectedOptions = [];
    }

    this._changed(this.selectedOptions);
  }

  isAllSelected(): boolean {
    return (
      this.optionsList.length > 0 &&
      this.selectedOptions.length === this.optionsList.length
    );
  }

  // ✅ IMPORTANT (edit case)
  override writeValue(value: DropdownModel[]): void {
    this.selectedOptions = value || [];
  }
  get selectedNames(): string {
  if (!this.selectedOptions || this.selectedOptions.length === 0) {
    return this.placeholder || 'Select values';
  }

  // 🔥 optional improvement
  if (this.isAllSelected()) {
    return 'All Selected';
  }

  return this.selectedOptions.map(x => x.name).join(', ');
}
}