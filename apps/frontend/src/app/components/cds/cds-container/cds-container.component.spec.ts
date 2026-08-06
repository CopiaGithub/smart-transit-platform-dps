import { ComponentFixture,TestBed } from '@angular/core/testing';
import { CdsContainerComponent } from './cds-container.component';

describe('CdsContainerComponent', () => {
  let component: CdsContainerComponent;
  let fixture: ComponentFixture<CdsContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsContainerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CdsContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
