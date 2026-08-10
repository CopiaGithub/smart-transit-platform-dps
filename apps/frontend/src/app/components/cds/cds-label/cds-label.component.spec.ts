import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsLabelComponent } from './cds-label.component';

describe('CdsLabelComponent', () => {
  let component: CdsLabelComponent;
  let fixture: ComponentFixture<CdsLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsLabelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdsLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
