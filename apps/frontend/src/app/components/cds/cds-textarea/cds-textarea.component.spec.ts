/* tslint:disable:no-unused-variable */
import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsTextareaComponent } from './cds-textarea.component';

describe('CdsTextareaComponent', () => {
  let component: CdsTextareaComponent<unknown>;
  let fixture: ComponentFixture<CdsTextareaComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CdsTextareaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<CdsTextareaComponent<unknown>>(CdsTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
