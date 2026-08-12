import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';

import { CdsButtonComponent } from '../../components/cds/cds-button/cds-button.component';
import { PopupComponent } from '../../components/popup/popup.component';
import { ApiService } from '../../core/api/api.service';
import { ApiError, PagedResult } from '../../core/api/api.types';
import { AuthService } from '../../services/auth/auth.service';
import { PageHeaderService } from '../../services/page-header.service';
import { BaseComponent, resolveErrorMessage } from '../common/base/BaseComponent';
import { HOME_SHORTCUTS } from './home-shortcuts';

/** apps/backend/Services/DispersalSessionService/DispersalSessionModel.cs */
interface DispersalSession {
  Id: number;
  SessionDate: string;
  ShiftName: string | null;
  StartedAt: string | null;
  Status: string;
  TotalBuses: number;
  InYard: number;
  Waiting: number;
  Departed: number;
}

interface PlatformStatus {
  PlatformCount: number;
  OccupiedCount: number;
  AvailableCount: number;
  NextFreePlatformNumber: number | null;
  YardFull: boolean;
}

interface BusStatus {
  SessionId: number | null;
  TotalBuses: number;
  AvailableCount: number;
  InYardCount: number;
  OutOfServiceCount: number;
}

interface DisplayRow {
  DisplayName: string;
  ConnectionStatus: string;
  IsActive: boolean;
}

/** Refreshed while the tab is visible. Not a live board, so not the 5s cadence. */
const REFRESH_MS = 30_000;

/**
 * F2 — Dashboard (WEB-APP-SCREENS.docx). One glance at today.
 *
 * Everything here is read-only except "Open Session", which is the one action
 * the spec puts on this screen because nothing else can be recorded until a
 * session exists.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, CdsButtonComponent, PopupComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent extends BaseComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly header = inject(PageHeaderService);

  readonly session = signal<DispersalSession | null>(null);
  readonly platforms = signal<PlatformStatus | null>(null);
  readonly buses = signal<BusStatus | null>(null);
  readonly displays = signal<DisplayRow[]>([]);

  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isOpeningSession = signal(false);

  private timer?: ReturnType<typeof setInterval>;
  private readonly onVisibilityChange = () => this.handleVisibilityChange();

  readonly userName = this.auth.getUserData()?.name ?? '';
  readonly isAdmin = this.auth.isAdmin();

  readonly hasOpenSession = computed(() => this.session()?.Status === 'Open');

  /** "Running for 2h 15m" — how long the dispersal has been going. */
  readonly sessionRunningFor = computed(() => {
    const startedAt = this.session()?.StartedAt;
    if (!startedAt || !this.hasOpenSession()) return null;

    const started = new Date(startedAt).getTime();
    if (Number.isNaN(started)) return null;

    const minutes = Math.max(0, Math.round((Date.now() - started) / 60_000));
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  });

  /** SessionDate is a DateOnly string; show it the way the school writes dates. */
  readonly sessionDateLabel = computed(() => {
    const date = this.session()?.SessionDate;
    if (!date) return '';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  readonly offlineDisplays = computed(() =>
    this.displays().filter((d) => d.IsActive && d.ConnectionStatus !== 'Online'),
  );

  readonly yardLabel = computed(() => {
    const p = this.platforms();
    return p ? `${p.OccupiedCount} / ${p.PlatformCount}` : '—';
  });

  ngOnInit(): void {
    this.header.setHeader(this, {
      title: 'Dashboard',
      id: 'home',
      showButton: false,
      breadcrumbs: [{ label: 'Home', route: '/mainlayout/home' }],
    });

    this.load();
    this.startPolling();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    this.header.clearHeader(this);
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  // ── Polling ──────────────────────────────────────────────────────────────
  //
  // Never poll a screen nobody is looking at, and never poll a dead network.

  private startPolling(): void {
    this.stopPolling();
    this.timer = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.load(true);
      }
    }, REFRESH_MS);
  }

  private stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.load(true);
    }
  }

  // ── Load ─────────────────────────────────────────────────────────────────

  load(silent = false): void {
    if (!silent) {
      this.isLoading.set(true);
    }
    this.loadError.set(null);

    // "No session open" is a normal state, not an error — the server answers
    // 404 for it, so that one case is folded to null and everything else throws.
    this.api
      .get<DispersalSession>('/DispersalSession/current')
      .pipe(take(1))
      .subscribe({
        next: (session) => this.session.set(session ?? null),
        error: (error: unknown) => {
          if (error instanceof ApiError && error.statusCode === 404) {
            this.session.set(null);
            return;
          }
          this.loadError.set(resolveErrorMessage(error, 'Could not load the session.'));
        },
      });

    this.api
      .get<PlatformStatus>('/BusOperations/platforms/status')
      .pipe(take(1))
      .subscribe({
        next: (status) => this.platforms.set(status ?? null),
        error: () => this.platforms.set(null),
      });

    // BusStatusModel.SessionId is nullable, so this still answers with
    // master-data counts when no session is open.
    this.api
      .get<BusStatus>('/BusOperations/buses/status')
      .pipe(take(1))
      .subscribe({
        next: (status) => {
          this.isLoading.set(false);
          this.buses.set(status ?? null);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.buses.set(null);
          this.loadError.set(resolveErrorMessage(error, 'Could not load bus status.'));
        },
      });

    this.api
      .get<PagedResult<DisplayRow>>('/DisplayMaster', { PageNumber: 1, PageSize: 100 })
      .pipe(take(1))
      .subscribe({
        next: (page) => this.displays.set(page?.Items ?? []),
        error: () => this.displays.set([]),
      });
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * The only write on this screen. Nothing operational can be recorded until a
   * session is open, and only one may be open across the whole school at a time,
   * so it asks first.
   */
  openSession(): void {
    this.confirm(
      'Open a dispersal session?',
      'This starts today\'s dispersal for the whole school. Only one session can ' +
        'be open at a time, and gate operators cannot record anything until it is.',
      'Open Session',
    )
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.isOpeningSession.set(true);
        this.api
          .post<DispersalSession>('/DispersalSession/open', {})
          .pipe(take(1))
          .subscribe({
            next: () => {
              this.isOpeningSession.set(false);
              this.load();
              this.showSuccess('Dispersal session opened.');
            },
            error: (error: unknown) => {
              this.isOpeningSession.set(false);
              this.showError(error, 'Could not open a session.');
            },
          });
      });
  }

  go(route: string): void {
    this.router.navigate([route]);
  }

  // ── Quick access ──────────────────────────────────────────────────────────

  /**
   * Every tile points at a master screen, and every master controller is
   * [Authorize(Roles = Admin)]. Offering them to a teacher or a gate operator
   * would just be a grid of buttons that lead to a 403, so the whole section is
   * admin-only and hides itself for everyone else.
   */
  readonly shortcuts = this.isAdmin ? HOME_SHORTCUTS : [];
}
