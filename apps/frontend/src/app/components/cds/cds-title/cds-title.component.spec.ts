/* tslint:disable:no-unused-variable */
import { ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsTitleComponent } from './cds-title.component';

describe('CdsTitleComponent', () => {
  let component: CdsTitleComponent;
  let fixture: ComponentFixture<CdsTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CdsTitleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CdsTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
