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
});
