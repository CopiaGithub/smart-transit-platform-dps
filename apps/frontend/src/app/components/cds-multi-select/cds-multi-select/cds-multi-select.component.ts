import { Component,EventEmitter,Input,Output } from '@angular/core';
import { DropdownModel } from '../../constants';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cds-multi-select',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './cds-multi-select.component.html',
  styleUrl: './cds-multi-select.component.css',
})
export class CdsMultiSelectComponent {
  @Input() optionsList: DropdownModel[] = [];
  @Input() placeholder: string = 'Select...';
  @Input() label: string = '';
  @Input() selectedItems: DropdownModel[] = [];

  @Output() selectionChange = new EventEmitter<DropdownModel[]>();

  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  isSelected(option: DropdownModel): boolean {
    return this.selectedItems.some((item) => item.value === option.value);
  }

  toggleItem(option: DropdownModel) {
    if (this.isSelected(option)) {
      this.selectedItems = this.selectedItems.filter(
        (item) => item.value !== option.value
      );
    } else {
      this.selectedItems = [...this.selectedItems, option];
    }

    this.selectionChange.emit(this.selectedItems);
  }

  get selectedItemNames(): string {
    return this.selectedItems && this.selectedItems.length > 0
      ? this.selectedItems.map((i) => i.name).join(', ')
      : this.placeholder;
  }
}
