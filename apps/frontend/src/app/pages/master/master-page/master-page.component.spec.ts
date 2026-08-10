import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MasterPageComponent } from './master-page.component';
import { MasterPageConfig } from './master-page.types';
import { environment } from '../../../environments/environment';

const TEST_CONFIG: MasterPageConfig = {
  title: 'State Master',
  listTitle: 'State Master List',
  resource: 'StateMaster',
  defaultSortBy: 'StateName',
  entityLabel: (row) => row.StateName,
  columns: [
    { key: 'StateName', label: 'State Name' },
    { key: 'Status', label: 'Status' },
  ],
  filters: [
    { name: 'search', label: 'Search', type: 'search', queryParam: 'SearchTerm' },
    {
      name: 'country',
      label: 'Country',
      type: 'dropdown',
      queryParam: 'countryId',
      optionsFrom: 'country',
    },
    {
      name: 'region',
      label: 'Region',
      type: 'dropdown',
      queryParam: 'regionId',
      optionsFrom: 'region',
      dependsOn: 'country',
    },
    { name: 'status', label: 'Status', type: 'status', queryParam: 'IsActive' },
  ],
  lookups: {
    country: { resource: 'CountryMaster', labelField: 'CountryName' },
    region: {
      resource: 'RegionMaster',
      labelField: 'RegionName',
      parentParam: 'countryId',
    },
  },
  fields: [{ name: 'StateName', label: 'State Name', type: 'text', required: true }],
  toRow: (item) => ({ id: item.Id, StateName: item.StateName, Status: 'Active' }),
  toFormData: (row) => ({ StateName: row.StateName }),
  toCreate: (result) => ({ StateName: result.StateName }),
  toUpdate: (result) => ({ StateName: result.StateName }),
};

const EMPTY_PAGE = {
  Success: true,
  Result: { Items: [], TotalRecords: 0, PageNumber: 1, PageSize: 25, TotalPages: 0 },
  StatusCode: 200,
  ErrorMessage: null,
};

describe('MasterPageComponent', () => {
  let fixture: ComponentFixture<MasterPageComponent>;
  let component: MasterPageComponent;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MasterPageComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', TEST_CONFIG);
    fixture.detectChanges();

    http = TestBed.inject(HttpTestingController);
  });

  /** The list request plus the one un-cascaded lookup fired on init. */
  function flushInitialRequests(): void {
    http.expectOne((r) => r.url === `${base}/StateMaster`).flush(EMPTY_PAGE);
    http.expectOne((r) => r.url === `${base}/CountryMaster`).flush(EMPTY_PAGE);
  }

  it('asks the server for page 1 with the configured sort on init', () => {
    const request = http.expectOne((r) => r.url === `${base}/StateMaster`);
    expect(request.request.params.get('PageNumber')).toBe('1');
    expect(request.request.params.get('PageSize')).toBe('25');
    expect(request.request.params.get('SortBy')).toBe('StateName');
    // Unset filters must not appear at all — IsActive=null means active-only.
    expect(request.request.params.has('SearchTerm')).toBe(false);
    expect(request.request.params.has('IsActive')).toBe(false);

    request.flush(EMPTY_PAGE);
    http.expectOne((r) => r.url === `${base}/CountryMaster`).flush(EMPTY_PAGE);
    http.verify();
  });

  it('does not load a cascading child lookup until its parent is chosen', () => {
    flushInitialRequests();
    // RegionMaster is scoped by countryId, so nothing is fetched yet.
    http.expectNone((r) => r.url === `${base}/RegionMaster`);
    http.verify();
  });

  it('maps each filter onto its own query parameter', () => {
    flushInitialRequests();

    component.filterForm.get('country')!.setValue({ name: 'India', value: 7 });
    // Choosing a parent refetches the child's options.
    http.expectOne((r) => r.url === `${base}/RegionMaster`).flush(EMPTY_PAGE);

    component.filterForm.get('region')!.setValue({ name: 'West', value: 3 });
    component.filterForm.get('status')!.setValue({ name: 'Inactive', value: false });
    component.onSearch();

    const request = http.expectOne((r) => r.url === `${base}/StateMaster`);
    expect(request.request.params.get('countryId')).toBe('7');
    expect(request.request.params.get('regionId')).toBe('3');
    expect(request.request.params.get('IsActive')).toBe('false');
    expect(request.request.params.get('PageNumber')).toBe('1');

    request.flush(EMPTY_PAGE);
    http.verify();
  });

  it('clears the child filter when the parent changes', () => {
    flushInitialRequests();

    component.filterForm.get('country')!.setValue({ name: 'India', value: 7 });
    http.expectOne((r) => r.url === `${base}/RegionMaster`).flush(EMPTY_PAGE);
    component.filterForm.get('region')!.setValue({ name: 'West', value: 3 });

    component.filterForm.get('country')!.setValue({ name: 'Kenya', value: 9 });
    http.expectOne((r) => r.url === `${base}/RegionMaster`).flush(EMPTY_PAGE);

    // An inconsistent country/region pair must never reach the server.
    expect(component.filterForm.get('region')!.value).toBeNull();
    http.verify();
  });

  it('keeps a cascading filter disabled until its parent is chosen', () => {
    flushInitialRequests();
    const regionFilter = TEST_CONFIG.filters[2];

    expect(component.isFilterDisabled(regionFilter)).toBe(true);
    component.filterForm.get('country')!.setValue({ name: 'India', value: 7 });
    expect(component.isFilterDisabled(regionFilter)).toBe(false);

    http.expectOne((r) => r.url === `${base}/RegionMaster`).flush(EMPTY_PAGE);
    http.verify();
  });

  it('shows the server error message and marks the offline case', () => {
    http
      .expectOne((r) => r.url === `${base}/StateMaster`)
      .flush(
        { Success: false, Result: null, StatusCode: 403, ErrorMessage: 'Not allowed.' },
        { status: 200, statusText: 'OK' },
      );
    http.expectOne((r) => r.url === `${base}/CountryMaster`).flush(EMPTY_PAGE);

    expect(component.loadError()).toBe('Not allowed.');
    expect(component.isOffline()).toBe(false);
    http.verify();
  });
});
