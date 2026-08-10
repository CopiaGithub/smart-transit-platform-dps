/* tslint:disable:no-unused-variable */
import { async,ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsToggleComponent } from './cds-toggle.component';

describe('CdsToggleComponent', () => {
  let component: CdsToggleComponent;
  let fixture: ComponentFixture<CdsToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CdsToggleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CdsToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
