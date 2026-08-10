import { ComponentFixture,TestBed } from '@angular/core/testing';

import { EditModelComponent } from './edit-model.component';

describe('EditModelComponent', () => {
  let component: EditModelComponent;
  let fixture: ComponentFixture<EditModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditModelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
