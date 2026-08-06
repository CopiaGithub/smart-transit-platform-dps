import {
Component,
EventEmitter,
forwardRef,
Input,Output
} from '@angular/core';
import { ControlValueAccessorDirective } from '../../directive';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'cds-checkbox',
  templateUrl: './cds-checkbox.component.html',
  styleUrls: ['./cds-checkbox.component.css'],
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsCheckboxComponent),
      multi: true,
    },
  ],
})
export class CdsCheckboxComponent<T> extends ControlValueAccessorDirective<T> {
  @Input() label: string = ''; // Label for the checkbox
  @Input() checked: boolean = false; // Default checked state
  @Output() checkedChange = new EventEmitter<boolean>(); // Event emitter to notify parent component

  toggleChecked() {
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked); // Emit the new value
  }
}
