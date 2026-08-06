import { CommonModule } from '@angular/common';
import { Component,forwardRef,Input } from '@angular/core';
import { NG_VALUE_ACCESSOR,ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CdsLabelComponent } from '../cds-label/cds-label.component';
import { ValidationErrorsComponent } from '../../validation-errors/validation-errors.component';
import { ControlValueAccessorDirective } from '../../directive';

@Component({
  selector: 'app-cds-textarea',
  templateUrl: './cds-textarea.component.html',
  styleUrls: ['./cds-textarea.component.css'],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    CommonModule,
    CdsLabelComponent,
    ValidationErrorsComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsTextareaComponent),
      multi: true,
    },
  ],
})
export class CdsTextareaComponent<T> extends ControlValueAccessorDirective<T> {
  @Input() placeholder = '';
  @Input() inputId = '';
  @Input() isAstRequired = true;
  @Input() label = '';
  @Input() rows: number = 4; // Default rows for textarea
  @Input() customErrorMessages: Record<string, string> = {};
  @Input() isDisabled = false;
  value = '';
}
