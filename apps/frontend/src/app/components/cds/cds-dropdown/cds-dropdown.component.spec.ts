import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsDropdownComponent } from './cds-dropdown.component';

describe('CdsDropdownComponent', () => {
  let component: CdsDropdownComponent;
  let fixture: ComponentFixture<CdsDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdsDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
