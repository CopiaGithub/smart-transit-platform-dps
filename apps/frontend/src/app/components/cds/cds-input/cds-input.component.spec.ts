import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsInputComponent } from './cds-input.component';

describe('CdsInputComponent', () => {
  let component: CdsInputComponent<unknown>;
  let fixture: ComponentFixture<CdsInputComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent<CdsInputComponent<unknown>>(CdsInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
