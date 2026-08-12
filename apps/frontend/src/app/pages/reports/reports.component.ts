import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';

import { CdsButtonComponent } from '../../components/cds/cds-button/cds-button.component';
import { PopupComponent } from '../../components/popup/popup.component';
import { ApiService } from '../../core/api/api.service';
import { PageHeaderService } from '../../services/page-header.service';
import { BaseComponent, resolveErrorMessage } from '../common/base/BaseComponent';
import { elapsedMs, formatServerTime } from '../../utils/server-time';

/**
 * apps/backend/Services/BusOperationsService/BusOperationsModel.cs, mirrored by
 * name so the two sides stay greppable. Same shape the mobile client reads in
 * apps/mobile/src/api/operations.api.ts.
 */
interface BoardRow {
  /** The boarding event — one bus in one session. NOT the bus id. */
  EventId: number;
  BusId: number;
  BusNumber: string;
  RouteId: number | null;
  RouteName: string | null;
  LedDisplayName: string | null;
  PlatformId: number | null;
  PlatformNumber: number | null;
  PlatformName: string | null;
  /** Waiting | Arrived | Boarding | Departed | Replaced */
  Status: string;
  QueueOrder: number;
  EnteredAt: string;
  AssignedAt: string | null;
  DepartedAt: string | null;
  ReplacedByBusNumber: string | null;
}

interface Board {
  SessionId: number;
  SessionDate: string;
  ShiftName: string | null;
  GeneratedAt: string;
  Rows: BoardRow[];
}

/** apps/mobile/constants/domain.ts — the same five, spelled the same way. */
const STATUS = {
  waiting: 'Waiting',
  arrived: 'Arrived',
  boarding: 'Boarding',
  departed: 'Departed',
  replaced: 'Replaced',
} as const;

type FilterKey = 'all' | 'departed' | 'onCampus' | 'replaced';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'departed', label: 'Departed' },
  { key: 'onCampus', label: 'On campus' },
  { key: 'replaced', label: 'Replaced' },
];

/** Matches the dashboard. A log, not a live board, so not the board's cadence. */
const REFRESH_MS = 30_000;

/**
 * The day's log — the web counterpart of the mobile Reports screen
 * (apps/mobile/features/reports/ReportsScreen.tsx).
 *
 * Every row is a boarding event the server recorded, so the times are the
 * moment a guard actually tapped. This is the audit trail, not a summary the
 * client computed — the only derived number here is average dwell, and it is
 * labelled as such.
 *
 * Read-only by design. Nothing on this screen writes; corrections belong at the
 * gate console where the event was recorded.
 */
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatIconModule, CdsButtonComponent, PopupComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent extends BaseComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly header = inject(PageHeaderService);

  readonly filters = FILTERS;

  /** Zoneless app: state written from a subscribe only repaints through signals. */
  readonly board = signal<Board | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly filter = signal<FilterKey>('all');

  private timer?: ReturnType<typeof setInterval>;
  private readonly onVisibilityChange = () => this.handleVisibilityChange();

  readonly rows = computed(() => this.board()?.Rows ?? []);

  readonly sessionLine = computed(() => {
    const board = this.board();
    if (!board) return '';
    const date = this.formatDate(board.SessionDate);
    return board.ShiftName ? `${date} · ${board.ShiftName}` : date;
  });

  readonly generatedAtLabel = computed(() =>
    formatServerTime(this.board()?.GeneratedAt),
  );

  // ── Counts ────────────────────────────────────────────────────────────────

  readonly recordedIn = computed(() => this.rows().length);

  readonly departedCount = computed(
    () => this.rows().filter((r) => r.Status === STATUS.departed).length,
  );

  readonly onCampusCount = computed(() => this.onCampus(this.rows()).length);

  /**
   * Turnaround only means anything for buses that completed a run — a bus still
   * on a platform has no dwell yet, and averaging in a zero would drag the
   * number down for the good reason that the day is not over.
   */
  readonly avgDwellLabel = computed(() => {
    const dwells = this.rows()
      .filter((r) => r.Status === STATUS.departed && r.AssignedAt && r.DepartedAt)
      .map((r) => elapsedMs(r.AssignedAt, r.DepartedAt) ?? 0);

    if (!dwells.length) return '—';

    const mins = dwells.reduce((a, b) => a + b, 0) / dwells.length / 60_000;
    return `${mins.toFixed(1)}m`;
  });

  // ── Table ─────────────────────────────────────────────────────────────────

  readonly shown = computed(() => {
    const rows = this.rows();
    const byFilter: Record<FilterKey, BoardRow[]> = {
      all: rows,
      departed: rows.filter((r) => r.Status === STATUS.departed),
      onCampus: this.onCampus(rows),
      replaced: rows.filter((r) => r.Status === STATUS.replaced),
    };

    // Oldest first: a log reads forwards, unlike the board.
    return [...byFilter[this.filter()]].sort((a, z) =>
      a.EnteredAt.localeCompare(z.EnteredAt),
    );
  });

  ngOnInit(): void {
    this.header.setHeader(this, {
      title: 'Reports',
      id: 'reports',
      showButton: false,
      breadcrumbs: [
        { label: 'Home', route: '/mainlayout/home' },
        { label: 'Reports', route: '/mainlayout/reports' },
      ],
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

  // ── Polling ───────────────────────────────────────────────────────────────
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

  // ── Load ──────────────────────────────────────────────────────────────────

  load(silent = false): void {
    if (!silent) {
      this.isLoading.set(true);
    }
    this.loadError.set(null);

    this.api
      .get<Board>('/BusOperations/board')
      .pipe(take(1))
      .subscribe({
        next: (board) => {
          this.isLoading.set(false);
          this.board.set(board ?? null);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          // The board is left alone on a silent refresh that failed: a
          // transient blip should not blank a log the admin is reading.
          this.loadError.set(
            resolveErrorMessage(error, "Could not load today's log."),
          );
        },
      });
  }

  setFilter(key: FilterKey): void {
    this.filter.set(key);
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  time(iso: string | null): string {
    return formatServerTime(iso) ?? '—';
  }

  /** Dwell for one row, blank until the bus has actually left. */
  dwell(row: BoardRow): string {
    const ms = elapsedMs(row.AssignedAt, row.DepartedAt);
    if (ms === null) return '—';
    return `${Math.round(ms / 60_000)}m`;
  }

  /** Drives the per-status badge colour; see reports.component.css. */
  statusClass(status: string): string {
    return `rep-status--${status.toLowerCase()}`;
  }

  private onCampus(rows: BoardRow[]): BoardRow[] {
    return rows.filter(
      (r) => r.Status === STATUS.arrived || r.Status === STATUS.boarding,
    );
  }

  private formatDate(date: string): string {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  // ── Export ────────────────────────────────────────────────────────────────

  /**
   * Exports what is on screen, filter included — an admin who filtered to
   * "Replaced" and exported expects the replacements, not the whole day.
   *
   * Built client-side from rows already fetched: there is no export endpoint on
   * BusOperationsController, and the day's log is one page of data, not a
   * paginated list that could exceed it.
   */
  exportCsv(): void {
    const rows = this.shown();
    if (!rows.length) return;

    const header = [
      'Bus No',
      'Route',
      'Status',
      'Station',
      'In',
      'Assigned',
      'Out',
      'Dwell',
      'Replaced By',
    ];

    const body = rows.map((row) => [
      row.BusNumber,
      row.RouteName ?? '',
      row.Status,
      row.PlatformNumber?.toString() ?? '',
      this.time(row.EnteredAt),
      this.time(row.AssignedAt),
      this.time(row.DepartedAt),
      this.dwell(row),
      row.ReplacedByBusNumber ?? '',
    ]);

    const csv = [header, ...body]
      .map((cells) => cells.map(csvCell).join(','))
      .join('\r\n');

    const date = this.board()?.SessionDate ?? 'today';
    // ﻿ so Excel opens it as UTF-8 rather than mangling any non-ASCII
    // route name.
    this.download(`Dispersal_Log_${date}.csv`, `﻿${csv}`);
  }

  private download(filename: string, content: string): void {
    const url = URL.createObjectURL(
      new Blob([content], { type: 'text/csv;charset=utf-8;' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

/** Quotes anything a spreadsheet would otherwise split or reinterpret. */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
