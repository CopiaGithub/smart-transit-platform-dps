import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsMultiSelectComponent } from './cds-multi-select.component';

describe('CdsMultiSelectComponent', () => {
  let component: CdsMultiSelectComponent;
  let fixture: ComponentFixture<CdsMultiSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsMultiSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdsMultiSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
