import { ComponentFixture,TestBed } from '@angular/core/testing';

import { DatepickerComponent } from './datepicker.component';

describe('DatepickerComponent', () => {
  let component: DatepickerComponent<unknown>;
  let fixture: ComponentFixture<DatepickerComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent<DatepickerComponent<unknown>>(DatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
