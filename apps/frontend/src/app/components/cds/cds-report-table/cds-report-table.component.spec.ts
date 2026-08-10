/* tslint:disable:no-unused-variable */
import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsReportTableComponent } from './cds-report-table.component';

describe('CdsReportTableComponent', () => {
  let component: CdsReportTableComponent<unknown>;
  let fixture: ComponentFixture<CdsReportTableComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CdsReportTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<CdsReportTableComponent<unknown>>(CdsReportTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
