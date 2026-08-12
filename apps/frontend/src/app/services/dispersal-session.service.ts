import { Injectable, computed, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { ApiService } from '../core/api/api.service';
import { ApiError } from '../core/api/api.types';

/** apps/backend/Services/DispersalSessionService/DispersalSessionModel.cs */
export interface DispersalSessionSummary {
  Id: number;
  SessionDate: string;
  ShiftName: string | null;
  StartedAt: string | null;
  Status: string;
}

/** Matches the dashboard's own cadence. Not a live board, so not the 5s one. */
const REFRESH_MS = 30_000;

/**
 * Whether a dispersal session is open, for anything that needs to say so.
 *
 * It lives in a service rather than in the header because the answer is global:
 * nothing operational can be recorded until a session is open, and only one may
 * be open across the whole school at a time.
 *
 * Every signed-in role may read it — GET /DispersalSession/current carries a
 * bare [Authorize], no role restriction — so the header can show it to a gate
 * operator and a teacher, not just an admin.
 */
@Injectable({ providedIn: 'root' })
export class DispersalSessionService {
  private readonly api = inject(ApiService);

  private readonly session = signal<DispersalSessionSummary | null>(null);
  /** Distinguishes "no session" from "we have not looked yet". */
  private readonly loaded = signal(false);

  /** Ticks so the elapsed label recomputes between refreshes. */
  private readonly now = signal(Date.now());

  readonly isOpen = computed(() => this.session()?.Status === 'Open');
  readonly hasLoaded = this.loaded.asReadonly();

  /** "2h 15m" — how long the dispersal has been running, or null. */
  readonly runningFor = computed(() => {
    const startedAt = this.session()?.StartedAt;
    if (!startedAt || !this.isOpen()) return null;

    const started = new Date(startedAt).getTime();
    if (Number.isNaN(started)) return null;

    const minutes = Math.max(0, Math.round((this.now() - started) / 60_000));
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  });

  constructor() {
    this.refresh();

    // Never poll a screen nobody is looking at, and never poll a dead network.
    setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.now.set(Date.now());
        this.refresh();
      }
    }, REFRESH_MS);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.now.set(Date.now());
        this.refresh();
      }
    });
  }

  refresh(): void {
    this.api
      .get<DispersalSessionSummary>('/DispersalSession/current')
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.session.set(session ?? null);
          this.loaded.set(true);
        },
        error: (error: unknown) => {
          // "No session open" is a normal state, and the server says it with a
          // 404. Anything else leaves the last known answer alone rather than
          // claiming the session closed because one poll failed.
          if (error instanceof ApiError && error.statusCode === 404) {
            this.session.set(null);
            this.loaded.set(true);
          }
        },
      });
  }
}
