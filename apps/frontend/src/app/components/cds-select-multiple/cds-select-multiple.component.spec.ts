/* tslint:disable:no-unused-variable */
import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsSelectMultipleComponent } from './cds-select-multiple.component';

describe('CdsSelectMultipleComponent', () => {
  let component: CdsSelectMultipleComponent<unknown>;
  let fixture: ComponentFixture<CdsSelectMultipleComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CdsSelectMultipleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<CdsSelectMultipleComponent<unknown>>(CdsSelectMultipleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
