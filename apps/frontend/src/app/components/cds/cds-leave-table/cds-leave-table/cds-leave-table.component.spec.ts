import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsLeaveTableComponent } from './cds-leave-table.component';

describe('CdsLeaveTableComponent', () => {
  let component: CdsLeaveTableComponent;
  let fixture: ComponentFixture<CdsLeaveTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsLeaveTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdsLeaveTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
