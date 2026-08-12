/* tslint:disable:no-unused-variable */
import { ComponentFixture,TestBed } from '@angular/core/testing';

import { TableComponent } from './table.component';

describe('TableComponent', () => {
  let component: TableComponent;
  let fixture: ComponentFixture<TableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The master pages hide the table behind an *ngIf while a page loads, so a
  // fresh instance is handed page 3's rows. Without the `page` input it would
  // report "1 / N" and disable Previous.
  it('adopts the caller’s page on a server-side rebuild', () => {
    component.isServerSidePagination = true;
    component.showPagination = true;
    component.itemsPerPage = 25;
    component.totalRecords = 120;
    component.page = 3;
    component.ngOnChanges();

    expect(component.currentPage).toBe(3);
    expect(component.totalPages).toBe(5);
  });

  it('leaves client-side pagination to its own page state', () => {
    component.isServerSidePagination = false;
    component.showPagination = true;
    component.itemsPerPage = 2;
    component.data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    component.ngOnChanges();
    component.nextPage();

    // `page` stays at its default, and must not drag the table back to page 1.
    component.ngOnChanges();

    expect(component.currentPage).toBe(2);
  });
});
