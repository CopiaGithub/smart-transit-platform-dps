/* tslint:disable:no-unused-variable */
import { ComponentFixture,TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CdsHeaderComponent } from './cds-header.component';

describe('CdsHeaderComponent', () => {
  let component: CdsHeaderComponent;
  let fixture: ComponentFixture<CdsHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CdsHeaderComponent ],
      providers: [provideNoopAnimations()],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CdsHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
