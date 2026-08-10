/* tslint:disable:no-unused-variable */
import { async,ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsSelectMultipleComponent } from './cds-select-multiple.component';

describe('CdsSelectMultipleComponent', () => {
  let component: CdsSelectMultipleComponent;
  let fixture: ComponentFixture<CdsSelectMultipleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CdsSelectMultipleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CdsSelectMultipleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
