import {
Component,
ElementRef,
EventEmitter,
HostListener,
Input,Output,
ViewChild
} from '@angular/core';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';
import { CdsLabelComponent } from '../cds/cds-label/cds-label.component';
import { DropdownModel } from '../constants';
import { ControlValueAccessorDirective } from '../directive';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-cds-select-multiple',
  templateUrl: './cds-select-multiple.component.html',
  styleUrls: ['./cds-select-multiple.component.css'],
  imports: [ValidationErrorsComponent, CdsLabelComponent, SpinnerComponent],
})
export class CdsSelectMultipleComponent<
  T
> extends ControlValueAccessorDirective<T[]> {
  @Input() label!: string;
  @Input() ddstyle!: string;
  @Input() isAstRequired = true;
  @Input() customclasses!: string;
  @Input() customlabel!: string;
  @Input() placeholder!: string;
  @Input() customErrorMessages: Record<string, string> = {};

  @Input() options: DropdownModel[] = [];
  @Output() valuesChange = new EventEmitter<DropdownModel[]>();

  @ViewChild('dropdownRef') dropdownRef!: ElementRef;

  dropdownOpen = false;
  selectedOptions: DropdownModel[] = [];
  displayText = '';

  // ✅ Called by Angular when form control writes a value
  override writeValue(value: DropdownModel[] | null): void {
    this.selectedOptions = value ?? [];
  }

  // Open/Close dropdown
  toggleDropdown(event: Event) {
    if (this.control?.disabled) {
      event.stopPropagation();
      return;
    }
    this.dropdownOpen = !this.dropdownOpen;
    event.stopPropagation();
  }

  // Close when clicked outside
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

  isSelected(option: DropdownModel): boolean {
    return this.selectedOptions.some((o) => o.value === option.value);
  }

  private updateDisplayText() {
    if (this.selectedOptions.length === 0) {
      this.displayText = '';
    } else if (this.selectedOptions.length === 1) {
      this.displayText = this.selectedOptions[0].name;
    } else {
      this.displayText = `${this.selectedOptions.length} selected`;
    }
  }

  toggleSelection(option: DropdownModel, event: Event) {
    event.stopPropagation();

    if (this.isSelected(option)) {
      this.selectedOptions = this.selectedOptions.filter(
        (o) => o.value !== option.value
      );
    } else {
      this.selectedOptions = [...this.selectedOptions, option];
    }

    this.updateDisplayText();

    // ✅ notify Angular forms
    this._changed(this.selectedOptions as any);
    this._onTouched();
    this.valuesChange.emit(this.selectedOptions);
  }

  // cds-select-multiple.component.ts
  isLoading = false; // default state

  // optional helper if you prefer method call
  isDataLoading(): boolean {
    return this.isLoading;
  }

  // <-- your main input list

  optionsList(): DropdownModel[] {
    return this.options; // later you can add filtering/sorting logic here
  }
}
