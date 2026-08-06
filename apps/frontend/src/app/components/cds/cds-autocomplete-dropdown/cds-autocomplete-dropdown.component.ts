import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdsLabelComponent } from '../cds-label/cds-label.component';
import { ValidationErrorsComponent } from '../../validation-errors/validation-errors.component';
import { ControlValueAccessorDirective } from '../../directive';
import { dropdownDisplayLabel } from '../../constants';

@Component({
  selector: 'cds-autocomplete-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdsLabelComponent,
    ValidationErrorsComponent,
  ],
  templateUrl: './cds-autocomplete-dropdown.component.html',
  styleUrl: './cds-autocomplete-dropdown.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsAutocompleteDropdownComponent),
      multi: true,
    },
  ],
})
export class CdsAutocompleteDropdownComponent
  extends ControlValueAccessorDirective<{ name: string; value: unknown } | null>
  implements OnInit, OnChanges, OnDestroy
{
  @ViewChild('dropdownAnchor') dropdownAnchor?: ElementRef<HTMLElement>;

  @Input() label = '';
  @Input() placeholder = 'Search...';
  @Input() options: { name: string; value: any; code?: string }[] = [];
  @Input() required = false;
  @Input() showNoRecords = false;
  @Input() customErrorMessages: Record<string, string> = {};

  @Output() selectionChange = new EventEmitter<any>();
  @Output() focused = new EventEmitter<void>();

  searchText = '';
  filteredOptions: { name: string; value: any; code?: string }[] = [];
  // ponytail: render at most this many options — thousands of <li> froze the
  // page on every keystroke for big lists (e.g. cities); typing narrows the rest
  private static readonly MAX_RENDERED = 100;
  hiddenMatchCount = 0;
  showDropdown = false;
  dropdownPosition: 'below' | 'above' = 'below';
  isDisabled = false;
  panelFixed = false;
  panelTop = 0;
  panelLeft = 0;
  panelWidth = 0;
  panelMaxHeight = 160;

  // isSelected(option: { name: string; value: any }): boolean {
  //   return this.selectedOption?.value === option.value;
  // }

  @HostBinding('class.cds-autocomplete-dropdown--open')
  get isDropdownOpen(): boolean {
    return this.showDropdown;
  }

  private selectedOption: { name: string; value: any; code?: string } | null = null;
  private isSelecting = false;
  private scrollParent: HTMLElement | null = null;
  private readonly onScrollReposition = () => {
    if (this.showDropdown && this.panelFixed) {
      this.updateDropdownPosition();
    }
  };

  override ngOnInit(): void {
    super.ngOnInit();
    const currentValue = this.control?.value;
    if (currentValue != null) {
      this.applyValue(currentValue);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      if (this.selectedOption != null) {
        this.syncDisplayText();
      } else {
        const currentValue = this.control?.value;
        if (currentValue != null) {
          this.applyValue(currentValue);
        }
      }

      if (this.showDropdown) {
        this.filteredOptions = this.filterOptions(this.searchText);
      }
    }
  }

  override writeValue(value: any): void {
    this.applyValue(value);
  }

  private applyValue(value: any): void {
    if (value == null) {
      this.selectedOption = null;
      this.searchText = '';
      return;
    }

    if (typeof value === 'object' && 'value' in value) {
      this.selectedOption = value;
      this.syncDisplayText();
    } else {
      this.selectedOption = { name: '', value };
      this.syncDisplayText();
    }
  }

  private syncDisplayText(): void {
    if (this.selectedOption == null) return;

    const match = this.options.find(
      (o) => o.value == this.selectedOption!.value,
    );

    if (match) {
      this.selectedOption = match;
      this.searchText = dropdownDisplayLabel(match);
    } else if (this.selectedOption.name) {
      this.searchText = dropdownDisplayLabel(this.selectedOption);
    }
  }

  isSelected(option: { name: string; value: any }): boolean {
    return this.selectedOption?.value === option.value;
  }

  override setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    super.setDisabledState?.(isDisabled);
  }

  onFocus() {
    if (this.isDisabled) return;
    this.focused.emit();
    this.openDropdown();
  }

  onClick() {
    if (this.isDisabled) return;
    this.openDropdown();
  }

  private openDropdown() {
    this.filteredOptions = this.filterOptions(this.searchText);
    this.showDropdown = true;
    this.bindScrollReposition();
    this.updateDropdownPosition();
  }

  onInput(value: string) {
    if (this.isSelecting) {
      return;
    }

    this.searchText = value;

    const isUnchangedSelection =
      this.selectedOption != null &&
      value === dropdownDisplayLabel(this.selectedOption);

    // Only clear the form value when leaving a real selection.
    // Do not emit null on every keystroke while typing (that spam-triggers APIs).
    if (!isUnchangedSelection && this.selectedOption != null) {
      this.selectedOption = null;
      this._changed?.(null);
      this.selectionChange.emit(null);
    }

    this.filteredOptions = this.filterOptions(value);

    this.showDropdown = true;
    this.bindScrollReposition();
    this.updateDropdownPosition();
  }

  selectOption(option: { name: string; value: any; code?: string }) {
    this.isSelecting = true;
    this.selectedOption = option;
    this.searchText = dropdownDisplayLabel(option);
    this.showDropdown = false;
    this.unbindScrollReposition();

    this._changed?.(option);
    this._onTouched?.();
    this.selectionChange.emit(option);

    setTimeout(() => {
      this.isSelecting = false;
    });
  }

  onBlur() {
    this._onTouched?.();

    setTimeout(() => {
      this.showDropdown = false;
      this.unbindScrollReposition();

      if (this.selectedOption) {
        this.searchText = dropdownDisplayLabel(this.selectedOption);
      } else {
        this.searchText = '';
      }
    }, 200);
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.showDropdown) {
      this.updateDropdownPosition();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (this.showDropdown && this.panelFixed) {
      this.updateDropdownPosition();
    }
  }

  ngOnDestroy(): void {
    this.unbindScrollReposition();
  }

  private updateDropdownPosition(): void {
    const run = () => {
      const anchor = this.dropdownAnchor?.nativeElement;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const inFormGrid = !!anchor.closest(
        '.inline-form-grid, .inline-form-grid-scroll',
      );
      this.panelFixed = inFormGrid;

      const optionCount =
        this.filteredOptions.length || (this.showNoRecords ? 1 : 0);
      const estimatedPanelHeight = Math.min(optionCount * 36, 160) + 8;

      if (inFormGrid) {
        this.dropdownPosition = 'below';
      } else {
        const boundary =
          (anchor.closest('.edit-modal-body') as HTMLElement | null) ??
          this.getScrollBoundary(anchor);
        const boundaryRect = boundary?.getBoundingClientRect();
        const boundaryTop = boundaryRect?.top ?? 0;
        const boundaryBottom = boundaryRect?.bottom ?? window.innerHeight;
        const spaceBelow = boundaryBottom - rect.bottom;
        const spaceAbove = rect.top - boundaryTop;

        this.dropdownPosition =
          spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow
            ? 'above'
            : 'below';
      }

      if (this.panelFixed) {
        this.panelWidth = Math.max(rect.width, 220);
        this.panelLeft = rect.left;
        if (this.dropdownPosition === 'above') {
          this.panelTop = Math.max(8, rect.top - estimatedPanelHeight - 4);
          this.panelMaxHeight = Math.min(160, rect.top - 8);
        } else {
          this.panelTop = rect.bottom + 4;
          this.panelMaxHeight = Math.min(
            160,
            window.innerHeight - this.panelTop - 8,
          );
        }
      }
    };

    if (this.dropdownAnchor?.nativeElement?.closest('.inline-form-grid')) {
      run();
    } else {
      setTimeout(run);
    }
  }

  private bindScrollReposition(): void {
    this.unbindScrollReposition();
    const anchor = this.dropdownAnchor?.nativeElement;
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

  private filterOptions(search: string): { name: string; value: any; code?: string }[] {
    const matches = search
      ? this.options.filter((o) => this.matchesSearch(o, search))
      : this.options;

    const max = CdsAutocompleteDropdownComponent.MAX_RENDERED;
    this.hiddenMatchCount = Math.max(0, matches.length - max);
    return matches.length > max ? matches.slice(0, max) : matches;
  }

  private matchesSearch(
    option: { name?: string; code?: string },
    search: string,
  ): boolean {
    const term = search.toLowerCase();
    if (String(option.name ?? '').toLowerCase().includes(term)) {
      return true;
    }
    if (option.code && String(option.code).toLowerCase().includes(term)) {
      return true;
    }
    return false;
  }

  displayLabel(option: { name: string; code?: string }): string {
    return dropdownDisplayLabel(option);
  }

  private getScrollBoundary(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;

    while (
      parent &&
      parent !== document.body &&
      parent !== document.documentElement
    ) {
      const styles = window.getComputedStyle(parent);
      const overflow = `${styles.overflow} ${styles.overflowY} ${styles.overflowX}`;

      if (/(auto|scroll|hidden|clip)/.test(overflow)) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return null;
  }
}
