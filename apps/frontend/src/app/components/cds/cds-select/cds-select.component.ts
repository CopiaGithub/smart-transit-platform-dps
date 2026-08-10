import {
  Component,
  Input,
  Output,
  EventEmitter,
  model,
  forwardRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ControlValueAccessorDirective } from '../../directive';
import {
  DropdownModel,
  ProductDDModel,
  dropdownDisplayLabel,
} from '../../constants';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdsLabelComponent } from '../cds-label/cds-label.component';
import { ValidationErrorsComponent } from '../../validation-errors/validation-errors.component';
import { SpinnerComponent } from '../../spinner/spinner.component';
import {
  ViewChild,
  ElementRef,
  HostBinding,
  HostListener,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { closeCdsSelect, openCdsSelect } from './cds-select-open.registry';

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
  selector: 'cds-select',
  standalone: true,
  templateUrl: './cds-select.component.html',
  styleUrls: ['./cds-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsSelectComponent),
      multi: true,
    },
  ],
  imports: [
    CdsLabelComponent,
    ValidationErrorsComponent,
    SpinnerComponent,
    MatIcon,
  ],
})
export class CdsSelectComponent<T>
  extends ControlValueAccessorDirective<T>
  implements OnInit, OnDestroy
{
  @Input() label!: string;
  @Input() ddstyle!: string;
  @Input() isAstRequired = true;
  @Input() customclasses!: string;
  @Input() customlabel!: string;
  @Input() value!: string; // Bind the selected value
  @Input() preSelected!: undefined;
  @Output() valueChange = new EventEmitter<DropdownModel>(); // Emit value changes
  @Output() valueProductChange = new EventEmitter<ProductDDModel>();
  @Input()
  values!: DropdownModel;
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
  panelFixed = false;
  panelTop = 0;
  panelLeft = 0;
  panelWidth = 0;
  private scrollParent: HTMLElement | null = null;
  private readonly onScrollReposition = () => {
    if (this.dropdownOpen && this.panelFixed) {
      this.updatePanelPosition();
    }
  };
  private readonly closeDropdown = () => {
    this.dropdownOpen = false;
    this.unbindScrollReposition();
    closeCdsSelect(this.closeDropdown);
  };

  // selectDropdownId is used to identify the select dropdown and options list, and to toggle the dropdown
  @Input() dropdownId: string = '';

  @HostBinding('class.cds-select--open')
  get isSelectOpen(): boolean {
    return this.dropdownOpen;
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  toggleDropdown(event: Event) {
    if (this.control?.disabled || this.isDataLoading()) {
      event.stopPropagation();
      return; // Prevent opening when disabled or loading
    }

    if (this.dropdownOpen) {
      this.closeDropdown();
    } else {
      openCdsSelect(this.closeDropdown);
      this.dropdownOpen = true;
      this.bindScrollReposition();
      this.updatePanelPosition();
    }

    event.stopPropagation();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.dropdownOpen && this.panelFixed) {
      this.updatePanelPosition();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (
      this.dropdownOpen &&
      this.dropdownRef &&
      !this.dropdownRef.nativeElement.contains(event.target)
    ) {
      this.closeDropdown();
    }
  }

  selectOption(val: DropdownModel) {
    if (this._changed) {
      this._changed(val as any);
    } else if (this.control) {
      this.control.setValue(val as any);
    }
    this._onTouched?.();
    this.valueChange.emit(val);
    this.unbindScrollReposition();
    this.closeDropdown();
  }

  selectProductOption(val: ProductDDModel) {
    if (this._changed) {
      this._changed(val as any);
    } else if (this.control) {
      this.control.setValue(val as any);
    }
    this._onTouched?.();
    this.valueProductChange.emit(val);
    this.unbindScrollReposition();
    this.closeDropdown();
  }

  displayLabel(option: DropdownModel | null | undefined): string {
    return dropdownDisplayLabel(option);
  }

  ngOnDestroy(): void {
    this.unbindScrollReposition();
    closeCdsSelect(this.closeDropdown);
  }

  private updatePanelPosition(): void {
    setTimeout(() => {
      const anchor = this.dropdownRef?.nativeElement;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      this.panelFixed = !!anchor.closest(
        '.inline-form-grid, .inline-form-grid-scroll',
      );
      if (!this.panelFixed) return;
      this.panelWidth = Math.max(rect.width, 220);
      this.panelLeft = rect.left;
      this.panelTop = rect.bottom + 4;
    });
  }

  private bindScrollReposition(): void {
    this.unbindScrollReposition();
    const anchor = this.dropdownRef?.nativeElement;
    if (!anchor) return;

    this.scrollParent = anchor.closest(
      '.inline-form-grid-scroll',
    ) as HTMLElement | null;
    this.scrollParent?.addEventListener('scroll', this.onScrollReposition, {
      passive: true,
    });
  }

  private unbindScrollReposition(): void {
    this.scrollParent?.removeEventListener('scroll', this.onScrollReposition);
    this.scrollParent = null;
  }
}
