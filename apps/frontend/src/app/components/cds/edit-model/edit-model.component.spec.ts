import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { EditModelComponent } from './edit-model.component';

function build(
  formFields: any[],
  formData: Record<string, unknown> = {},
  extra: { allData?: any[]; duplicateCheckFields?: string[] } = {},
): ComponentFixture<EditModelComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [EditModelComponent],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          title: 'Add',
          formFields,
          formData,
          allData: extra.allData ?? [],
          duplicateCheckFields: extra.duplicateCheckFields ?? [],
        },
      },
      { provide: MatDialogRef, useValue: { close: () => {} } },
    ],
  });

  const fixture = TestBed.createComponent(EditModelComponent);
  fixture.detectChanges();
  return fixture;
}

describe('EditModelComponent', () => {
  it('should create', () => {
    const fixture = build([{ name: 'Name', label: 'Name', type: 'text' }]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('name-based validator fallbacks', () => {
    it('does not aim the pincode rule at a dropdown holding a record id', () => {
      // Parent Master's PinCodeId picks a PinCodeMaster row. The box shows
      // "400614" but the value is that row's id, so a 6-digit rule here rejects
      // every valid selection.
      const fixture = build(
        [{ name: 'PinCodeId', label: 'PinCode', type: 'dropdown' }],
        { PinCodeId: 42 },
      );

      const control = fixture.componentInstance.form.get('PinCodeId');
      expect(control?.valid).toBe(true);
    });

    it('still applies the pincode rule to a typed pincode', () => {
      const fixture = build(
        [{ name: 'PinCode', label: 'PinCode', type: 'text' }],
        { PinCode: '4006' },
      );

      const control = fixture.componentInstance.form.get('PinCode');
      expect(control?.hasError('pattern')).toBe(true);
    });

    it('accepts a real 6-digit pincode', () => {
      const fixture = build(
        [{ name: 'PinCode', label: 'PinCode', type: 'text' }],
        { PinCode: '400614' },
      );

      expect(fixture.componentInstance.form.get('PinCode')?.valid).toBe(true);
    });

    it('does not aim the email rule at a dropdown holding a record id', () => {
      const fixture = build(
        [{ name: 'EmailTemplateId', label: 'Template', type: 'dropdown' }],
        { EmailTemplateId: 7 },
      );

      expect(fixture.componentInstance.form.get('EmailTemplateId')?.valid).toBe(true);
    });
  });

  describe('a save refused by validation', () => {
    const tabbedFields = [
      { name: 'FirstName', label: 'First Name', type: 'text', tab: 'Basic' },
      { name: 'PhotoUrl', label: 'Photo', type: 'file', tab: 'Basic' },
      { name: 'PickupStop', label: 'Pickup Stop', type: 'text', tab: 'Transport', required: true },
    ];

    it('says which field is blocking it instead of failing silently', async () => {
      const fixture = build(tabbedFields, { FirstName: 'Asha', PickupStop: '' });
      const component = fixture.componentInstance;

      await component.onSave();

      expect(component.saveError()).toBe('Pickup Stop is required.');
    });

    it('switches to the tab holding the offending field', async () => {
      const fixture = build(tabbedFields, { FirstName: 'Asha', PickupStop: '' });
      const component = fixture.componentInstance;
      expect(component.activeTab).toBe('Basic');

      await component.onSave();

      expect(component.activeTab).toBe('Transport');
    });

    it('stays quiet when the form is valid', async () => {
      const fixture = build(tabbedFields, { FirstName: 'Asha', PickupStop: 'Gate 6' });
      const component = fixture.componentInstance;

      await component.onSave();

      expect(component.saveError()).toBeNull();
    });
  });

  describe('duplicate Sort Order', () => {
    const fields = [
      { name: 'GateCode', label: 'Gate Code', type: 'text' },
      { name: 'SortOrder', label: 'Sort Order', type: 'number' },
    ];
    const existing = [
      { id: 1, GateCode: 'G1', SortOrder: 1 },
      { id: 2, GateCode: 'G2', SortOrder: 2 },
    ];
    const opts = { allData: existing, duplicateCheckFields: ['GateCode', 'SortOrder'] };

    it('refuses a sort order another gate already uses', async () => {
      const fixture = build(fields, { GateCode: 'G3', SortOrder: 2 }, opts);
      const component = fixture.componentInstance;

      await component.onSave();

      expect(component.form.get('SortOrder')?.hasError('duplicate')).toBe(true);
    });

    it('lets a record keep its own sort order while editing', async () => {
      // id 2 editing itself: SortOrder 2 belongs to this very row.
      const fixture = build(fields, { id: 2, GateCode: 'G2', SortOrder: 2 }, opts);
      const component = fixture.componentInstance;

      await component.onSave();

      expect(component.form.get('SortOrder')?.hasError('duplicate')).toBe(false);
    });

    it('accepts a sort order nobody is using', async () => {
      const fixture = build(fields, { GateCode: 'G3', SortOrder: 7 }, opts);
      const component = fixture.componentInstance;

      await component.onSave();

      expect(component.form.get('SortOrder')?.hasError('duplicate')).toBe(false);
    });
  });
});