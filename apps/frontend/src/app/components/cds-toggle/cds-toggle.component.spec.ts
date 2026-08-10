/* tslint:disable:no-unused-variable */
import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsToggleComponent } from './cds-toggle.component';

describe('CdsToggleComponent', () => {
  let component: CdsToggleComponent;
  let fixture: ComponentFixture<CdsToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CdsToggleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CdsToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
