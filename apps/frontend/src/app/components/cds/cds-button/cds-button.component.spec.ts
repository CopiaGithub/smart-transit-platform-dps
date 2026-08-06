import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsButtonComponent } from './cds-button.component';

describe('CdsButtonComponent', () => {
  let component: CdsButtonComponent;
  let fixture: ComponentFixture<CdsButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdsButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
