import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsMultiSelectDdComponent } from './cds-multi-select-dd.component';

describe('CdsMultiSelectDdComponent', () => {
  let component: CdsMultiSelectDdComponent;
  let fixture: ComponentFixture<CdsMultiSelectDdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsMultiSelectDdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdsMultiSelectDdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
