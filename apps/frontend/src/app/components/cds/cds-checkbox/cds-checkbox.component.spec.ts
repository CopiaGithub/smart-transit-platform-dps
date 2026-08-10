/* tslint:disable:no-unused-variable */
import { async,ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsCheckboxComponent } from './cds-checkbox.component';

describe('CdsCheckboxComponent', () => {
  let component: CdsCheckboxComponent;
  let fixture: ComponentFixture<CdsCheckboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CdsCheckboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CdsCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
