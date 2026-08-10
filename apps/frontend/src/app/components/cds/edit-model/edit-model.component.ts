import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgFor, NgIf } from '@angular/common';
import { DatepickerComponent } from '../../datepicker/datepicker.component';
import { CdsInputComponent } from '../cds-input/cds-input.component';
import { CdsTextareaComponent } from '../cds-textarea/cds-textarea.component';
import { CdsAutocompleteDropdownComponent } from '../cds-autocomplete-dropdown/cds-autocomplete-dropdown.component';
import { CdsButtonComponent } from '../cds-button/cds-button.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-model',
  imports: [
    ReactiveFormsModule,
    NgFor,
    NgIf,
    DatepickerComponent,
    CdsInputComponent,
    CdsTextareaComponent,
    CdsAutocompleteDropdownComponent,
    CdsButtonComponent,
    MatIconModule,
  ],
  templateUrl: './edit-model.component.html',
  styleUrl: './edit-model.component.css',
})
export class EditModelComponent {
  @ViewChildren('dropdownWrapper', { read: ElementRef })
  dropdownWrappers!: QueryList<ElementRef>;
  @Output() fieldValueChanged = new EventEmitter<{
    fieldName: string;
    value: any;
    formValues: any;
  }>();
  form: FormGroup;
  fields: any[] = [];
  fieldErrors: { [key: string]: string } = {};
  currentId: number | null = null;
  duplicateCheckFields: string[];
  duplicateCheckCombinationOfFields: string[] = [];
  IsDeligationMatrixPage: boolean = false;
  disableSaveButton: boolean = false;
  displayUserProfileSection: Boolean;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  showImageModal = false;
  previewUrl: string | null = null;
  errorMsg: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditModelComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      formFields: any[];
      formData: any;
      allData: any[];
      duplicateCheckFields: string[];
      duplicateCheckCombinationOfFields?: string[];
      IsDeligationMatrixPage?: Boolean;
      disableSaveButton?: boolean;
      displayUserProfileSection?: Boolean;
      footerMode?: 'default' | 'view';
      viewMode?: boolean;
      saveButtonText?: string;
    },
  ) {
    this.fields = data.formFields;
    this.form = this.fb.group({});

    this.currentId = data.formData.id;
    this.duplicateCheckFields = data.duplicateCheckFields || [];
    this.duplicateCheckCombinationOfFields =
      data.duplicateCheckCombinationOfFields || [];
    this.disableSaveButton = data.disableSaveButton ?? false;
    this.displayUserProfileSection = data.displayUserProfileSection ?? false;
    if (this.displayUserProfileSection == true) {
      this.previewUrl = this.data.formData.profilePic || null;
    }
    // this.IsDeligationMatrixPage = this.data.IsDeligationMatrixPage;

    // Build form dynamically
    this.fields.forEach((field) => {
      const validators = this.getFieldValidators(field);
      // let initialValue =
      //   this.data.formData[field.name] !== undefined
      //     ? this.data.formData[field.name]
      //     : field.value || '';

      let initialValue =
        this.data.formData[field.name] !== undefined
          ? this.data.formData[field.name]
          : (field.value ?? (field.multiple ? [] : ''));

      // A checkbox needs a real boolean — '' would silently read back as '' on save.
      if (field.type === 'toggle') {
        initialValue = !!initialValue;
      }

      if (field.type === 'dropdown' && Array.isArray(field.optionsList)) {
        const matchedOption = field.optionsList.find(
          (opt: { name: string; value: any }) => opt.name === initialValue,
        );
        if (matchedOption) {
          initialValue = matchedOption.value;
        }
      }

      this.form.addControl(
        field.name,
        this.fb.control(
          { value: initialValue, disabled: !!field.disabled }, // Apply disabled here
          validators,
        ),
      );
      this.form.addControl('profilePic', this.fb.control(this.previewUrl));
    });
    this.refreshFieldVisibility(false);
    this.tabs = this.collectTabs();
    this.activeTab = this.tabs[0] ?? '';
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  //
  // A tab only hides fields visually. Unlike visibleWhen, a field on an inactive
  // tab keeps its validators and is still included on save — otherwise filling in
  // tab 1 and saving would silently drop everything on tab 2.

  tabs: string[] = [];
  activeTab = '';

  private collectTabs(): string[] {
    const names: string[] = [];
    for (const field of this.fields) {
      if (field.tab && !names.includes(field.tab)) {
        names.push(field.tab);
      }
    }
    return names;
  }

  fieldsForActiveTab(): any[] {
    if (!this.tabs.length) {
      return this.fields;
    }
    return this.fields.filter((f) => (f.tab ?? this.tabs[0]) === this.activeTab);
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
  }

  /** Marks a tab that holds a control the user still has to fix. */
  tabHasError(tab: string): boolean {
    return this.fields.some((f) => {
      if ((f.tab ?? this.tabs[0]) !== tab) return false;
      const control = this.form.get(f.name);
      return !!control && control.invalid && control.touched;
    });
  }
  onMultiSelectChange(fieldName: string, event: any) {
    const selectedValues = Array.from(event.target.selectedOptions).map(
      (opt: any) => opt.value,
    );

    this.form.get(fieldName)?.setValue(selectedValues);

    this.fieldValueChanged.emit({
      fieldName,
      value: selectedValues,
      formValues: this.getFormValues(),
    });
  }

  updateFieldOptions(fieldName: string, options: any[]) {
    const field = this.fields.find((f: any) => f.name === fieldName);
    if (field) {
      field.optionsList = options;

      // if this field is already in the form, reset its value
      if (this.form.contains(fieldName)) {
        this.form.get(fieldName)?.reset();
      }
    }
  }

  async onChangeFile(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      this.errorMsg = null;

      // Optional: Add file size limit (e.g., 5MB)
      const maxSize = 2 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        this.errorMsg = 'File size exceeds the 2MB limit.';
        event.target.value = ''; // Clear the input
        return;
      }

      if (
        file.type === 'image/png' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/jpg'
      ) {
        try {
          const base64 = await this.toBase64(file);

          // Patch the form value with the base64 string
          this.form.patchValue({ profilePic: base64 });
        } catch (error) {
          console.error('Error converting file to base64:', error);
          this.errorMsg = 'Error processing file. Please try again.';
          event.target.value = ''; // Clear the input on error
        }
      } else {
        this.errorMsg = 'Only JPEG, JPG, and PNG files are allowed.';
        event.target.value = ''; // Clear the input
      }
    }
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
        resolve(e.target?.result as string);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  openImageModal() {
    this.showImageModal = true;
  }

  closeImageModal() {
    this.showImageModal = false;
  }

  // onFieldChange(fieldName: string, event: any) {
  //   const value = event.target?.value ?? event.value;
  //   this.fieldValueChanged.emit({
  //     fieldName,
  //     value,
  //     formValues: this.getFormValues(),
  //   });
  //   this.refreshFieldVisibility();
  //   // if(this.IsDeligationMatrixPage == true){
  //   // this.form.invalid == false;
  //   // this.setFieldError('managerId', '');
  //   // this.setFieldError('userId', '');
  //   // }
  // }
onFieldChange(fieldName: string, event: any) {
  const value = event.target?.value ?? event.value;
  this.fieldValueChanged.emit({
    fieldName,
    value,
    formValues: this.getFormValues(),
  });
  this.refreshFieldVisibility();

  // ✅ Recalculate approved days whenever From Date, To Date or Day Type changes
  if (['fromDate', 'toDate', 'dayType'].includes(fieldName)) {
    this.recalculateApprovedDays();
  }
}
private recalculateApprovedDays() {
  // ✅ use .get() not .contains() — contains() excludes disabled controls
  if (!this.form.get('noOfDaysApproved')) {
    return;
  }

  const fromDateVal = this.form.get('fromDate')?.value;
  const toDateVal = this.form.get('toDate')?.value;
  const dayTypeVal = this.form.get('dayType')?.value;

  if (!fromDateVal || !toDateVal || !dayTypeVal) {
    return;
  }

  const from = new Date(fromDateVal);
  const to = new Date(toDateVal);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return;
  }

  const daysDiff = (to.getTime() - from.getTime()) / (1000 * 3600 * 24);

  let noOfDaysApproved = 0;
  if (Number(dayTypeVal) === 3) {
    noOfDaysApproved = daysDiff + 1;
  } else if (Number(dayTypeVal) === 1 || Number(dayTypeVal) === 2) {
    noOfDaysApproved = daysDiff + 0.5;
  }

  if (noOfDaysApproved < 0 || isNaN(noOfDaysApproved)) {
    noOfDaysApproved = 0;
  }

  this.form
    .get('noOfDaysApproved')
    ?.setValue(noOfDaysApproved, { emitEvent: false });
}
  // onSave() {
  //   if (this.form.valid) {
  //     const rawValues = this.form.value;
  //     const finalFormData: any = {};

  //     this.fields.forEach((field) => {
  //       const fieldValue = rawValues[field.name];
  //       console.log(fieldValue);

  //       if (field.type === 'dropdown') {
  //         finalFormData[field.name] = fieldValue;
  //         console.log(finalFormData);
  //       } else {
  //         finalFormData[field.name] = fieldValue;
  //       }
  //     });

  //     console.log('Saving form with values:', finalFormData);
  //     this.dialogRef.close(finalFormData);
  //   } else {
  //     Object.keys(this.form.controls).forEach((key) => {
  //       const control = this.form.get(key);
  //       control?.markAsTouched();
  //     });
  //   }
  // }

  phoneNumberValidator(control: any) {
    const value = control.value;
    // Accepts only 10 digit numbers
    const valid = /^\d{10}$/.test(value);
    return valid ? null : { phoneNumber: true };
  }
  onSave() {
    this.refreshFieldVisibility(false);

    // 🔹 Always mark all controls as touched so validation shows on Save click
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsTouched();
      this.form.get(key)?.updateValueAndValidity();
    });

    this.fields.forEach((field) => {
      const validators = this.getFieldValidators(field);
      this.form.get(field.name)?.setValidators(validators);
      this.form.get(field.name)?.updateValueAndValidity();
    });

    this.fields.forEach((field) => {
      const control = this.form.get(field.name);
      if (!control || !field.required || !this.isFieldVisible(field)) {
        return;
      }

      const value = control.value;
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        control.setErrors({ ...(control.errors ?? {}), required: true });
        control.markAsTouched();
      }
    });

    // 🔹 Stop early if required validation fails
    if (this.form.invalid) {
      return;
    }

    const rawValues = this.form.value;
    const finalFormData: any = {};

    console.log(rawValues);

    const otherRecords = (this.data.allData || []).filter(
      (d) => d.id !== this.currentId,
    );

    console.log(otherRecords);

    const duplicateFields: string[] = [];
    console.log(this.duplicateCheckCombinationOfFields);
    const IsDeligationMatrixPage = this.data.IsDeligationMatrixPage ?? false;

    if (this.duplicateCheckCombinationOfFields.length > 0) {
      const currentValues = this.duplicateCheckCombinationOfFields.map(
        (field) => rawValues[field]?.toString().trim().toLowerCase(),
      );
      console.log(currentValues);

      if (currentValues.every((val) => val)) {
        const isDuplicate = otherRecords.some((record) =>
          this.duplicateCheckCombinationOfFields.every(
            (field, index) =>
              record[field]?.toString().trim().toLowerCase() ===
              currentValues[index],
          ),
        );
        console.log(isDuplicate);

        if (isDuplicate) {
          this.duplicateCheckCombinationOfFields.forEach((field) => {
            this.form.get(field)?.setErrors({ duplicate: true });
          });
          duplicateFields.push(...this.duplicateCheckCombinationOfFields);
        } else {
          // clear duplicate error if exists
          this.duplicateCheckCombinationOfFields.forEach((field) => {
            if (this.form.get(field)?.hasError('duplicate')) {
              this.form.get(field)?.setErrors(null);
            }
          });
        }
      }
    } else if (!IsDeligationMatrixPage) {
      // 🔹 Normal duplicate check
      this.duplicateCheckFields.forEach((field) => {
        const currentValue = rawValues[field]?.toString().trim().toLowerCase();
        if (currentValue) {
          const isDuplicate = otherRecords.some(
            (record) =>
              record[field]?.toString().trim().toLowerCase() === currentValue,
          );

          if (isDuplicate) {
            this.form.get(field)?.setErrors({ duplicate: true });
            duplicateFields.push(field);
          } else {
            // clear duplicate error if exists
            if (this.form.get(field)?.hasError('duplicate')) {
              this.form.get(field)?.setErrors(null);
            }
          }
        }
      });
    } else {
      // 🔹 Delegation matrix page duplicate check
      const managerId = Number(rawValues['managerId']);
      const userId = Number(rawValues['userId']);

      const isDuplicate = otherRecords.some(
        (item: any) =>
          item.managerId === managerId &&
          item.userId === userId &&
          item.id !== this.currentId,
      );

      if (isDuplicate) {
        this.form.get('userId')?.setErrors({ duplicate: true });
        duplicateFields.push('userId');
      }

      const userAlreadyAllocated = otherRecords.some(
        (item: any) => item.userId === userId,
      );

      if (userAlreadyAllocated) {
        this.form.get('managerId')?.setErrors({ duplicate: true });
        duplicateFields.push('managerId');
      }
    }

    console.log(duplicateFields);

    // 🔹 Stop if duplicate errors exist
    if (duplicateFields.length > 0) {
      return;
    }

    // 🔹 Build final form data
    this.fields.forEach((field) => {
      if (this.isFieldVisible(field)) {
        finalFormData[field.name] = rawValues[field.name];
      }
    });

    finalFormData['profilePic'] = this.previewUrl;

    // 🔹 Return final data
    this.dialogRef.close(finalFormData);
  }

  hasDuplicateErrors(): boolean {
    return Object.values(this.fieldErrors).some((error) => !!error);
  }

  setFieldError(fieldName: string, message: string) {
    this.fieldErrors[fieldName] = message;
    if (message) {
      this.form.get(fieldName)?.setErrors({ duplicate: true });
    } else {
      const control = this.form.get(fieldName);
      if (control?.errors?.['duplicate']) {
        delete control.errors['duplicate'];
        control.setErrors(
          Object.keys(control.errors).length ? control.errors : null,
        );
      }
    }
  }

  // onSave() {
  //   if (this.form.valid) {
  //     const rawValues = this.form.value;
  //     const finalFormData: any = {};

  //     this.fields.forEach((field) => {
  //       const fieldValue = rawValues[field.name];

  //       if (field.type === 'dropdown') {
  //         const selectedOption = field.optionsList.find(
  //           (opt: any) => opt.value === fieldValue
  //         );
  //         finalFormData[field.name] = selectedOption?.name || fieldValue;
  //       } else {
  //         finalFormData[field.name] = fieldValue;
  //       }
  //     });

  //     console.log('Saving form with values:', finalFormData);
  //     this.dialogRef.close(finalFormData);
  //   } else {
  //     Object.keys(this.form.controls).forEach((key) => {
  //       const control = this.form.get(key);
  //       control?.markAsTouched();
  //     });
  //   }
  // }

  onCancel() {
    this.dialogRef.close(null);
  }

  getFieldValue(fieldName: string): any {
    return this.form.get(fieldName)?.value;
  }

  getFormValues(): any {
    return this.form?.getRawValue?.() || {};
  }
  isFieldVisible(field: any): boolean {
    const visibleWhen = field.visibleWhen;
    if (!visibleWhen) {
      return true;
    }

    const dependencyName = visibleWhen.fieldName ?? visibleWhen.field;
    const expectedValue = visibleWhen.value ?? visibleWhen.equals;
    const currentValue = this.form?.get(dependencyName)?.value;

    if (Array.isArray(expectedValue)) {
      return expectedValue.includes(currentValue);
    }

    return currentValue === expectedValue;
  }

  private getFieldValidators(field: any) {
    if (!this.isFieldVisible(field)) {
      return [];
    }

    const validators = field.required ? [Validators.required] : [];

    // Explicit constraints from the field descriptor. Prefer these — they let a
    // form mirror the server's own MaxLength instead of guessing.
    if (typeof field.maxLength === 'number') {
      validators.push(Validators.maxLength(field.maxLength));
    }

    if (typeof field.minLength === 'number') {
      validators.push(Validators.minLength(field.minLength));
    }

    if (field.pattern) {
      validators.push(Validators.pattern(field.pattern));
    }

    // Name-based fallbacks, kept for descriptors that declare nothing explicit.
    if (!field.pattern && field.name.toLowerCase().includes('pincode')) {
      validators.push(Validators.pattern(/^[0-9]{6}$/));
    }

    if (field.minLength === undefined && field.name.includes('phoneNo')) {
      validators.push(Validators.minLength(10), Validators.maxLength(10));
    }

    if (field.name.toLowerCase().includes('email')) {
      validators.push(Validators.email);
    }

    return validators;
  }

  private refreshFieldVisibility(resetHiddenFields: boolean = true) {
    this.fields.forEach((field) => {
      const control = this.form.get(field.name);
      if (!control) {
        return;
      }

      if (!this.isFieldVisible(field) && resetHiddenFields) {
        control.reset(field.multiple ? [] : field.type === 'toggle' ? false : '');
      }

      control.setValidators(this.getFieldValidators(field));
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  dropdownOpenMap: { [key: string]: boolean } = {};
  dropdownPositionMap: { [key: string]: 'below' | 'above' } = {};

  toggleDropdown(fieldName: string, event: MouseEvent) {
    this.dropdownOpenMap[fieldName] = !this.dropdownOpenMap[fieldName];

    if (this.dropdownOpenMap[fieldName]) {
      this.updateDropdownPosition(fieldName, event.currentTarget as HTMLElement);
    }
  }

  isOptionSelected(fieldName: string, value: any): boolean {
    const selected = this.form.get(fieldName)?.value || [];
    return selected.includes(value);
  }

  onCheckboxChange(fieldName: string, value: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const control = this.form.get(fieldName);
    const current = control?.value || [];

    if (checked) {
      control?.setValue([...current, value]);
    } else {
      control?.setValue(current.filter((v: any) => v !== value));
    }

    this.fieldValueChanged.emit({
      fieldName,
      value: control?.value,
      formValues: this.getFormValues(),
    });
    this.refreshFieldVisibility();
  }

  isAllSelected(field: any): boolean {
    const selected = this.form.get(field.name)?.value || [];
    return (
      field.optionsList?.length && selected.length === field.optionsList.length
    );
  }

  onSelectAll(field: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const values = checked ? field.optionsList.map((o: any) => o.value) : [];
    this.form.get(field.name)?.setValue(values);
    this.refreshFieldVisibility();
  }
  getMultiSelectDisplay(field: any): string {
    const selectedValues: any[] = this.form.get(field.name)?.value || [];

    if (!selectedValues.length) {
      return 'Select ' + field.label;
    }

    const selectedNames = field.optionsList
      .filter((o: any) => selectedValues.includes(o.value))
      .map((o: any) => o.name);

    return selectedNames.join(', ');
  }
  @HostListener('document:click', ['$event'])
  closeDropdownOutside(event: MouseEvent) {
    const clickedInside = this.dropdownWrappers?.some((wrapper) =>
      wrapper.nativeElement.contains(event.target),
    );

    if (!clickedInside) {
      Object.keys(this.dropdownOpenMap).forEach((field) => {
        this.dropdownOpenMap[field] = false;
      });
    }
  }

  private updateDropdownPosition(fieldName: string, trigger: HTMLElement) {
    setTimeout(() => {
      const wrapper = trigger.closest('.edit-modal-dropdown-wrapper') as HTMLElement | null;
      const dropdown = wrapper?.querySelector('.edit-modal-dropdown') as HTMLElement | null;
      if (!wrapper || !dropdown) return;

      const rect = wrapper.getBoundingClientRect();
      const boundary = wrapper.closest('.edit-modal-body') as HTMLElement | null;
      const boundaryRect = boundary?.getBoundingClientRect();
      const boundaryTop = boundaryRect?.top ?? 0;
      const boundaryBottom = boundaryRect?.bottom ?? window.innerHeight;
      const spaceBelow = boundaryBottom - rect.bottom;
      const spaceAbove = rect.top - boundaryTop;
      const panelHeight = Math.min(dropdown.scrollHeight || 0, 192) + 8;

      this.dropdownPositionMap[fieldName] =
        spaceBelow < panelHeight && spaceAbove > spaceBelow ? 'above' : 'below';
    });
  }
}
