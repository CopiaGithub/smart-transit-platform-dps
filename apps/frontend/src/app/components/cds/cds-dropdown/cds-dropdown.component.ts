import { Component,EventEmitter,Input,model,OnDestroy,Output } from '@angular/core';
import { ControlValueAccessorDirective } from '../../directive';
import { DropdownModel } from '../../constants';
import { closeCdsSelect, openCdsSelect } from '../cds-select/cds-select-open.registry';

interface Option {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-cds-dropdown',
  imports: [],
  templateUrl: './cds-dropdown.component.html',
  styleUrl: './cds-dropdown.component.css',
})
export class CdsDropdownComponent<T> extends ControlValueAccessorDirective<T> implements OnDestroy {
  @Input() label!: string;
  @Input() ddstyle!: string;
  @Input() customclasses!: string;
  @Input() value!: string; // Bind the selected value
  @Input() preSelected!: undefined;
  @Output() valueChange = new EventEmitter<DropdownModel>(); // Emit value changes
  @Input() options: Option[] = [];
  @Input() placeholder!: string;
  @Input() customErrorMessages: Record<string, string> = {};
  public optionsList = model<Array<DropdownModel>>([]);
  public isDataLoading = model(false);
  dropdownOpen = false;
  selectedValue = '';
  private readonly closeDropdown = () => {
    this.dropdownOpen = false;
    closeCdsSelect(this.closeDropdown);
  };

  toggleDropdown(event: Event) {
    if (this.dropdownOpen) {
      this.closeDropdown();
    } else {
      openCdsSelect(this.closeDropdown);
      this.dropdownOpen = true;
    }
    event.stopPropagation(); // Prevent click from closing the dropdown immediately
  }

  closeDropdownOnOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.closeDropdown();
    }
  }

  selectOption(val: DropdownModel) {
    this._changed(val as any);
    this.valueChange.emit(val); // Emit the selected value
    this.closeDropdown();
  }

  ngOnDestroy(): void {
    closeCdsSelect(this.closeDropdown);
  }
}
