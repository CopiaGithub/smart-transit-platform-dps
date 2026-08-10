/* tslint:disable:no-unused-variable */
import { async,ComponentFixture,TestBed } from '@angular/core/testing';

import { CdsTitleComponent } from './cds-title.component';

describe('CdsTitleComponent', () => {
  let component: CdsTitleComponent;
  let fixture: ComponentFixture<CdsTitleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CdsTitleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CdsTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
