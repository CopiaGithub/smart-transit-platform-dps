import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  CdsCollectionFieldComponent,
  CollectionColumn,
} from './cds-collection-field.component';

const COLUMNS: CollectionColumn[] = [
  { key: 'ParentId', label: 'Parent', type: 'dropdown' },
  { key: 'Relation', label: 'Relation', type: 'text' },
  { key: 'IsPrimaryContact', label: 'Primary', type: 'radio' },
  { key: 'CanCollect', label: 'Can collect', type: 'toggle', value: true },
];

describe('CdsCollectionFieldComponent', () => {
  let component: CdsCollectionFieldComponent;
  let fixture: ComponentFixture<CdsCollectionFieldComponent>;
  let written: Record<string, unknown>[] | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdsCollectionFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CdsCollectionFieldComponent);
    component = fixture.componentInstance;
    component.columns = COLUMNS;
    component.registerOnChange((value) => (written = value));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts a new row from the column defaults', () => {
    component.addRow();

    expect(written?.length).toBe(1);
    expect(written?.[0]['CanCollect']).toBe(true);
    expect(written?.[0]['ParentId']).toBeNull();
  });

  it('makes the first row primary, but not the second', () => {
    component.addRow();
    component.addRow();

    expect(written?.[0]['IsPrimaryContact']).toBe(true);
    expect(written?.[1]['IsPrimaryContact']).toBe(false);
  });

  it('moves the primary flag rather than allowing two', () => {
    component.addRow();
    component.addRow();

    component.selectExclusive(COLUMNS[2], 1);

    expect(written?.[0]['IsPrimaryContact']).toBe(false);
    expect(written?.[1]['IsPrimaryContact']).toBe(true);
  });

  it('hands the primary flag on when the primary row is removed', () => {
    component.addRow();
    component.addRow();
    component.selectExclusive(COLUMNS[2], 0);

    component.removeRow(0);

    expect(written?.length).toBe(1);
    expect(written?.[0]['IsPrimaryContact']).toBe(true);
  });

  it('round-trips unknown keys so record ids survive an edit', () => {
    component.writeValue([
      { MappingId: 42, ParentId: 7, Relation: 'Father', IsPrimaryContact: true },
    ]);
    component.onCellChange();

    expect(written?.[0]['MappingId']).toBe(42);
    expect(written?.[0]['ParentId']).toBe(7);
  });

  it('treats a non-array value as an empty list', () => {
    component.writeValue(null);
    expect(component.rows.length).toBe(0);
  });
});
