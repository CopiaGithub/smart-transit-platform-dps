import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ApiService } from './api.service';
import { ApiError } from './api.types';
import { environment } from '../../environments/environment';

/**
 * These cover the contract the whole app rests on: this API answers HTTP 200 for
 * every failure and puts the real outcome in the body.
 */
describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps Result on success', async () => {
    const result = api.get<{ Id: number }>('/CountryMaster/1');
    const promise = firstValue(result);

    http.expectOne(`${base}/CountryMaster/1`).flush({
      Success: true,
      Result: { Id: 1 },
      StatusCode: 200,
      ErrorMessage: null,
    });

    expect(await promise).toEqual({ Id: 1 });
  });

  it('throws the server ErrorMessage when Success is false, even on HTTP 200', async () => {
    const promise = firstError(api.post('/Auth/login', {}));

    http.expectOne(`${base}/Auth/login`).flush(
      {
        Success: false,
        Result: null,
        StatusCode: 401,
        ErrorMessage: 'Invalid username or password.',
      },
      { status: 200, statusText: 'OK' },
    );

    const error = await promise;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Invalid username or password.');
    expect(error.statusCode).toBe(401);
    expect(error.isUnauthorized).toBe(true);
  });

  it('builds an ApiError from the wire status for a bare 403 with no body', async () => {
    const promise = firstError(api.get('/Attendance/roster'));

    http
      .expectOne(`${base}/Attendance/roster`)
      .flush(null, { status: 403, statusText: 'Forbidden' });

    const error = await promise;
    // 403 must stay distinct from 401 — it never signs the user out.
    expect(error.isForbidden).toBe(true);
    expect(error.isUnauthorized).toBe(false);
  });

  it('retries a GET once when there was no reply at all', async () => {
    const promise = firstValue(api.get<number[]>('/RoutesMaster'));

    http
      .expectOne(`${base}/RoutesMaster`)
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    // The retry is delayed, so let the timer fire.
    await sleep(400);

    http
      .expectOne(`${base}/RoutesMaster`)
      .flush({ Success: true, Result: [1], StatusCode: 200, ErrorMessage: null });

    expect(await promise).toEqual([1]);
  });

  it('never retries a write, because it may already have been processed', async () => {
    const promise = firstError(api.post('/BusOperations/gate-in', {}));

    http
      .expectOne(`${base}/BusOperations/gate-in`)
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    const error = await promise;
    expect(error.isNetworkError).toBe(true);
    http.expectNone(`${base}/BusOperations/gate-in`);
  });

  it('drops empty filters from the query string', async () => {
    const promise = firstValue(
      api.get('/CityMaster', {
        PageNumber: 1,
        SearchTerm: null,
        stateId: undefined,
        regionId: '',
        IsActive: false,
      }),
    );

    const request = http.expectOne(
      (req) => req.url === `${base}/CityMaster`,
    );
    expect(request.request.params.keys().sort()).toEqual(['IsActive', 'PageNumber']);
    // false is a meaningful filter value and must survive.
    expect(request.request.params.get('IsActive')).toBe('false');

    request.flush({ Success: true, Result: null, StatusCode: 200, ErrorMessage: null });
    await promise;
  });
});

function firstValue<T>(source: { subscribe: Function }): Promise<T> {
  return new Promise((resolve, reject) => {
    source.subscribe({ next: resolve, error: reject });
  });
}

function firstError(source: { subscribe: Function }): Promise<ApiError> {
  return new Promise((resolve) => {
    source.subscribe({ next: () => {}, error: resolve });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
