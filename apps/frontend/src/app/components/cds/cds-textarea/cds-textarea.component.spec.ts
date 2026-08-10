/* tslint:disable:no-unused-variable */
import { async,ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsTextareaComponent } from './cds-textarea.component';

describe('CdsTextareaComponent', () => {
  let component: CdsTextareaComponent;
  let fixture: ComponentFixture<CdsTextareaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CdsTextareaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CdsTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
