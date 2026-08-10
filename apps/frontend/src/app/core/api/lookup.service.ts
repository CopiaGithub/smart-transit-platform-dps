import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs';
import { ApiService, QueryParams } from './api.service';
import { PagedResult } from './api.types';
import { DropdownModel } from '../../components/constants';

/**
 * Describes how to turn a master list endpoint into dropdown options.
 *
 * This backend has no `*DD` endpoints (unlike DMS), so options come from the
 * ordinary list endpoint with a large page size.
 */
export interface LookupConfig {
  /** Controller name, e.g. 'CountryMaster'. */
  resource: string;
  /** Field carrying the id. Defaults to 'Id'. */
  valueField?: string;
  /** Field carrying the display text, e.g. 'CountryName'. */
  labelField: string;
  /** Optional business code; renders as "IN — India" via dropdownDisplayLabel(). */
  codeField?: string;
  /** Query param naming the parent, e.g. 'countryId' on RegionMaster. */
  parentParam?: string;
}

/** Options are fetched once per (resource, parent) pair and cached for the session. */
const LOOKUP_PAGE_SIZE = 500;

@Injectable({ providedIn: 'root' })
export class LookupService {
  private readonly api = inject(ApiService);
  private readonly cache = new Map<string, Observable<DropdownModel[]>>();

  /**
   * @param parentId When the config declares a `parentParam`, options are scoped
   *   to this parent. A null parent yields an empty list — a cascading child must
   *   stay empty (and disabled) until its parent is chosen.
   */
  options(config: LookupConfig, parentId?: number | null): Observable<DropdownModel[]> {
    if (config.parentParam && (parentId === null || parentId === undefined)) {
      return of([]);
    }

    const key = `${config.resource}:${parentId ?? ''}`;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const query: QueryParams = { PageNumber: 1, PageSize: LOOKUP_PAGE_SIZE };
    if (config.parentParam && parentId != null) {
      query[config.parentParam] = parentId;
    }

    const request = this.api
      .get<PagedResult<Record<string, unknown>>>(`/${config.resource}`, query)
      .pipe(
        map((page) => (page?.Items ?? []).map((item) => toOption(item, config))),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.cache.set(key, request);
    return request;
  }

  /** Call after a write so the next dropdown read reflects it. */
  invalidate(resource: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(`${resource}:`)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

function toOption(item: Record<string, unknown>, config: LookupConfig): DropdownModel {
  const valueField = config.valueField ?? 'Id';
  const code = config.codeField ? item[config.codeField] : null;

  return {
    name: String(item[config.labelField] ?? ''),
    value: item[valueField],
    code: code == null ? undefined : String(code),
  };
}
