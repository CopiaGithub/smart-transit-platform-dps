import { CommonModule } from '@angular/common';
import {
Component,
EventEmitter,
Input,
Output,
forwardRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdsLabelComponent } from '../cds/cds-label/cds-label.component';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';
import { ControlValueAccessorDirective } from '../directive';

@Component({
  selector: 'app-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true,
    },
  ],
  imports: [CommonModule, CdsLabelComponent, ValidationErrorsComponent],
})
export class DatepickerComponent<T> extends ControlValueAccessorDirective<T> {
  @Input() label!: string;
  @Input() placeholder: string = 'dd-mm-yyyy';
  @Input() isAstRequired = true;
  @Input() errorMessage!: string;
  @Input() customErrorMessages: Record<string, string> = {};
  @Input() pickerMode: 'date' | 'month' = 'date';
  // Default container styles
  @Input() containerClass: string = 'relative w-full mt-1';

  // Default label styles
  @Input() labelClass: string = 'font-medium';

  // Default input styles - can be completely overridden
  @Input() inputClass: string =
    'block w-full px-3 py-1.5 mt-1 text-sm text-gray-700 bg-white border rounded-md border-gray-300 focus:outline-none focus:ring focus:ring-blue-200 focus:border-blue-500 placeholder-gray-400';

  @Input() minDate?: string;
  @Input() maxDate?: string;

  @Output() dateChange = new EventEmitter<string>();

  rawValue: string = ''; // YYYY-MM-DD for <input type="date">
  displayValue: string = ''; // DD MMM YYYY for showing in the UI

  override writeValue(value: string): void {
    if (value) {
      this.rawValue = this.normalizeValue(value);
      if (this.pickerMode === 'month' && this.rawValue) {
        this.rawValue = this.rawValue.slice(0, 7); // Ensure YYYY-MM for month picker
      }
      this.displayValue = this.formatDate(value);
    } else {
      this.rawValue = '';
      this.displayValue = '';
    }
  }

  onDateChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value;

    if (this.pickerMode === 'month') {
      // Store as full date internally (YYYY-MM-01) but show month-year
      value = value ? `${value}-01` : '';
    }

    this.rawValue = this.normalizeValue(value);
    this.displayValue = this.formatDate(value);

    // Min/max check
    if (this.minDate && value < this.minDate) value = this.minDate;
    if (this.maxDate && value > this.maxDate) value = this.maxDate;

    if (this._changed) this._changed(value as any);
    if (this._onTouched) this._onTouched();
    this.dateChange.emit(value);
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return this.pickerMode === 'month'
      ? date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  private normalizeValue(value: string): string {
    return this.pickerMode === 'month' ? value.slice(0, 7) : value;
  }
}
