import {
Component,
Input,
Output,
EventEmitter,
model,
forwardRef
} from '@angular/core';
import { ControlValueAccessorDirective } from '../../directive';
import { DropdownModel,ProductDDModel } from '../../constants';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdsLabelComponent } from '../cds-label/cds-label.component';
import { ValidationErrorsComponent } from '../../validation-errors/validation-errors.component';
import { SpinnerComponent } from '../../spinner/spinner.component';
import { ViewChild,ElementRef,HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
interface Option {
  value: string;
  viewValue: string;
}

interface OptionProductDD {
  id: number;
  materialCode: string;
  description: string;
  uomId: number;
  salesUnit1Id: number;
  salesUnitQty: number;
  salesUnit2Id: number;
  salesUnitQty2: number;
  weightUnitId: number;
  grossWeight: number;
  netWeight: number;
  isActive: boolean;
}
@Component({
  selector: 'cds-select-vertical',
  standalone: true,
  templateUrl: './cds-select-vertical.component.html',
  styleUrls: ['./cds-select-vertical.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsSelectVerticalComponent),
      multi: true,
    },
  ],
  imports: [
    CdsLabelComponent,
    ValidationErrorsComponent,
    SpinnerComponent,
    CommonModule,
  ],
})
export class CdsSelectVerticalComponent<
  T
> extends ControlValueAccessorDirective<T> {
  @Input() label!: string;
  @Input() ddstyle!: string;
  @Input() isAstRequired = false;
  @Input() customclasses!: string;
  @Input() customlabel!: string;
  @Input() value!: string; // Bind the selected value
  @Input() preSelected!: undefined;
  @Output() valueChange = new EventEmitter<DropdownModel>(); // Emit value changes
  @Output() valueProductChange = new EventEmitter<ProductDDModel>();
  @Input() options: Option[] = [];
  @Input() optionsProduct: OptionProductDD[] = [];
  @Input() placeholder!: string;
  @Input() customErrorMessages: Record<string, string> = {};
  @Input() multiple: boolean = false;
  @ViewChild('dropdownRef') dropdownRef!: ElementRef;

  public optionsList = model<Array<DropdownModel>>([]);
  public optionsProductList = model<Array<ProductDDModel>>([]);
  public isDataLoading = model(false);
  dropdownOpen = false;
  selectedValue = '';

  toggleDropdown(event: Event) {
    if (this.control?.disabled || this.isDataLoading()) {
      event.stopPropagation();
      return; // Prevent opening when disabled or loading
    }
    this.dropdownOpen = !this.dropdownOpen;
    event.stopPropagation();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (
      this.dropdownOpen &&
      this.dropdownRef &&
      !this.dropdownRef.nativeElement.contains(event.target)
    ) {
      this.dropdownOpen = false;
    }
  }

  selectOption(val: DropdownModel) {
    this._changed(val as any);
    this.valueChange.emit(val); // Emit the selected value
    this.dropdownOpen = false;
  }

  selectProductOption(val: ProductDDModel) {
    this._changed(val as any);
    this.valueProductChange.emit(val); // Emit the selected value
    this.dropdownOpen = false;
  }

  getSelectedIcon(): string | null {
    const value = this.control?.value;
    if (!value) return null;

    if (value.icon) return value.icon;

    const match = this.optionsList()?.find((opt) => opt.value === value.value);

    return match?.icon || null;
  }
}
