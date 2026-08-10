import {
Directive,
Inject,
Injector,
Input,
OnInit
} from '@angular/core';
import {
ControlValueAccessor,
FormControl,
Validators,
NgControl,
FormControlName,
FormGroupDirective,
FormControlDirective,
} from '@angular/forms';

@Directive({
  selector: '[appControlValueAccessor]',
})
export class ControlValueAccessorDirective<T>
  implements ControlValueAccessor, OnInit
{
  control: FormControl | undefined;
  isRequired = false;
  @Input() public isSubmitted = false;
  protected _onTouched!: () => T;
  protected _changed!: (val: T) => T;
  private _isDisabled = false;

  constructor(@Inject(Injector) private injector: Injector) {}

  ngOnInit() {
    this.setFormControl();
    this.isRequired = this.control?.hasValidator(Validators.required) ?? false;
  }

  setFormControl() {
    try {
      const formControl = this.injector.get(NgControl);

      switch (formControl.constructor) {
        case FormControlName:
          this.control = this.injector
            .get(FormGroupDirective)
            .getControl(formControl as FormControlName);
          break;
        default:
          this.control = (formControl as FormControlDirective)
            .form as FormControl;
          break;
      }
    } catch (err) {
      this.control = new FormControl();
    }
  }

  // writeValue(value: T): void {
  //   this.control
  //     ? this.control.setValue(value)
  //     : (this.control = new FormControl(value));
  // }

  writeValue(value: any): void {
    if (this.control && this.control.value != value) {
      this.control.setValue(value, { emitEvent: false });
    }
  }

  registerOnChange(fn: (val: T | null) => T): void {
    this._changed = fn;
  }

  registerOnTouched(fn: () => T): void {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this._isDisabled = isDisabled;
  }
}
