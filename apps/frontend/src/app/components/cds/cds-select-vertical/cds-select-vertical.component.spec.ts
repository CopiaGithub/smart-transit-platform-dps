import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsSelectVerticalComponent } from './cds-select-vertical.component';

describe('CdsSelectVerticalComponent', () => {
  let component: CdsSelectVerticalComponent;
  let fixture: ComponentFixture<CdsSelectVerticalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsSelectVerticalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdsSelectVerticalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
