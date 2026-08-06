import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsInputComponent } from './cds-input.component';

describe('CdsInputComponent', () => {
  let component: CdsInputComponent;
  let fixture: ComponentFixture<CdsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdsInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
