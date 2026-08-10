/* tslint:disable:no-unused-variable */
import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsCurrentDataComponent } from './cds-current-data.component';

describe('CdsCurrentDataComponent', () => {
  let component: CdsCurrentDataComponent;
  let fixture: ComponentFixture<CdsCurrentDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CdsCurrentDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CdsCurrentDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
