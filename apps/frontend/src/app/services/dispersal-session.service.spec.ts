import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { DispersalSessionService } from './dispersal-session.service';
import { environment } from '../environments/environment';

describe('DispersalSessionService', () => {
  const url = `${environment.apiUrl}/DispersalSession/current`;
  let service: DispersalSessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    // Constructed here, not at declaration: the constructor fires the first
    // request, and the testing backend has to exist before it does.
    service = TestBed.inject(DispersalSessionService);
    http = TestBed.inject(HttpTestingController);
  });

  function flush(body: unknown, statusCode = 200): void {
    http
      .expectOne(url)
      .flush({ Success: statusCode === 200, Result: body, StatusCode: statusCode });
  }

  it('says nothing until the first answer arrives', () => {
    expect(service.hasLoaded()).toBe(false);
    flush(null);
  });

  it('reports an open session and how long it has been running', () => {
    const startedAt = new Date(Date.now() - 135 * 60_000).toISOString();
    flush({ Id: 1, SessionDate: '2026-08-12', ShiftName: null, StartedAt: startedAt, Status: 'Open' });

    expect(service.isOpen()).toBe(true);
    expect(service.runningFor()).toBe('2h 15m');
  });

  it('treats the server 404 as the ordinary "no session open" state', () => {
    http.expectOne(url).flush(
      { Success: false, Result: null, StatusCode: 404, ErrorMessage: 'No open session.' },
      { status: 200, statusText: 'OK' },
    );

    expect(service.hasLoaded()).toBe(true);
    expect(service.isOpen()).toBe(false);
  });

  it('keeps the last known answer when a refresh fails', () => {
    const startedAt = new Date(Date.now() - 30 * 60_000).toISOString();
    flush({ Id: 1, SessionDate: '2026-08-12', ShiftName: null, StartedAt: startedAt, Status: 'Open' });
    expect(service.isOpen()).toBe(true);

    // A dropped poll must not claim the session closed.
    service.refresh();
    http.expectOne(url).error(new ProgressEvent('error'));

    expect(service.isOpen()).toBe(true);
  });
});
