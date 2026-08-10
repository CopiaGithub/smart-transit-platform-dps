/* tslint:disable:no-unused-variable */
import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsCheckboxComponent } from './cds-checkbox.component';

describe('CdsCheckboxComponent', () => {
  let component: CdsCheckboxComponent<unknown>;
  let fixture: ComponentFixture<CdsCheckboxComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CdsCheckboxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<CdsCheckboxComponent<unknown>>(CdsCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
