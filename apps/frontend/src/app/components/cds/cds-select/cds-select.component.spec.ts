/* tslint:disable:no-unused-variable */
import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsSelectComponent } from './cds-select.component';

describe('CdsSelectComponent', () => {
  let component: CdsSelectComponent<unknown>;
  let fixture: ComponentFixture<CdsSelectComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CdsSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<CdsSelectComponent<unknown>>(CdsSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
