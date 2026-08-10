import { Component,forwardRef,Input } from '@angular/core';
import { ValidationErrorsComponent } from '../../validation-errors/validation-errors.component';
import { InputType } from '../../constants';
import { NG_VALUE_ACCESSOR,ReactiveFormsModule } from '@angular/forms';
import { CdsLabelComponent } from '../cds-label/cds-label.component';
import { ControlValueAccessorDirective } from '../../directive';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'cds-input',
  imports: [
    ValidationErrorsComponent,
    CdsLabelComponent,
    ReactiveFormsModule,
    CommonModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsInputComponent),
      multi: true,
    },
  ],
  templateUrl: './cds-input.component.html',
  styleUrl: './cds-input.component.css',
})
export class CdsInputComponent<T> extends ControlValueAccessorDirective<T> {
  @Input() placeholder = '';
  @Input() inputId = '';
  @Input() label = '';
  @Input() customLabel = '';
  @Input() type: InputType = 'text';
  @Input() customErrorMessages: Record<string, string> = {};
  @Input() isDisabled = false;
  @Input() isAstRequired = true;
  @Input() displayValue: string = '';
  @Input() value = '';
  @Input() inputstyleClass: string = '';

  override writeValue(value: any): void {
    this.value = value ?? '';
    this.displayValue = this.value;
    super.writeValue(this.value);
  }

  onInputChange(event: Event): void {
    const newValue = (event.target as HTMLInputElement).value;
    this.displayValue = newValue;
    this.value = newValue;

    // Notify Angular form of value change
    this._changed?.(newValue as T); // Fixed type casting
    this._onTouched?.(); // Use correct method name
  }
}
