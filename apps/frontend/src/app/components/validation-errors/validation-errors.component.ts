import { CommonModule } from '@angular/common';
import { Component,input,Input,SimpleChanges } from '@angular/core';
import {
FormControl,
ReactiveFormsModule,
ValidationErrors,
} from '@angular/forms';

@Component({
  selector: 'cds-validation-errors',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './validation-errors.component.html',
  styleUrl: './validation-errors.component.css',
})
export class ValidationErrorsComponent {
  control = input.required<FormControl>();
  @Input() errors: Record<string, ValidationErrors> | null = {};
  @Input() customErrorMessages: Record<string, string> = {};
  @Input() public isSubmitted = false;
  errorMessages: Record<string, string> = {
    required: 'This field is required',
    email: 'Invalid email address',
    minlength: 'Input is shorter than required length',
    maxlength: 'Input exceeds maximum allowed length',
    pattern: 'Invalid format',
  };

  ngOnChanges(changes: SimpleChanges): void {
    const { customErrorMessages } = changes;
    if (customErrorMessages) {
      this.errorMessages = {
        ...this.errorMessages,
        ...customErrorMessages.currentValue,
      };
    }
  }
}
