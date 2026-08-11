import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsAutocompleteDropdownComponent } from './cds-autocomplete-dropdown.component';

describe('CdsAutocompleteDropdownComponent', () => {
  let component: CdsAutocompleteDropdownComponent;
  let fixture: ComponentFixture<CdsAutocompleteDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsAutocompleteDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdsAutocompleteDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('what it writes to the form control', () => {
    const option = { name: 'Pune', value: 12 };
    let written: unknown;

    beforeEach(() => {
      component.options = [option];
      component.registerOnChange((val: any) => (written = val));
    });

    it('writes the whole option by default', () => {
      component.selectOption(option);
      expect(written).toEqual(option);
    });

    it('writes only the value when valueOnly is set', () => {
      component.valueOnly = true;
      component.selectOption(option);
      expect(written).toBe(12);
    });

    it('shows the option name for a scalar value written in', () => {
      component.valueOnly = true;
      component.writeValue(12);
      expect(component.searchText).toBe('Pune');
    });
  });
});
