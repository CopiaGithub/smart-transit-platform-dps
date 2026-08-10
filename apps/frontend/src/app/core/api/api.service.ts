import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiEnvelope, ApiError } from './api.types';

/** Values that may be handed to a query string. */
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

/**
 * The one place the response envelope exists.
 *
 * Every method returns the unwrapped `Result`. A `Success: false` body becomes a
 * thrown `ApiError` carrying the server's own `ErrorMessage`, so screens can show
 * the server's refusal rather than a generic "something went wrong".
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Called when a request comes back 401 (token gone or expired). Registered by
   * AuthService — kept as a callback so ApiService does not depend on it, which
   * would be a DI cycle.
   */
  private onUnauthorized: (() => void) | null = null;

  setUnauthorizedHandler(handler: () => void): void {
    this.onUnauthorized = handler;
  }

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.request<T>(
      this.http.get<ApiEnvelope<T>>(this.url(path), {
        params: toHttpParams(params),
      }),
      // One retry, GET only, and only when there was no reply at all.
      true,
    );
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>(this.http.post<ApiEnvelope<T>>(this.url(path), body), false);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>(this.http.patch<ApiEnvelope<T>>(this.url(path), body), false);
  }

  delete<T>(path: string): Observable<T> {
    return this.request<T>(this.http.delete<ApiEnvelope<T>>(this.url(path)), false);
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private request<T>(
    source: Observable<ApiEnvelope<T>>,
    retryOnNetworkFailure: boolean,
  ): Observable<T> {
    let stream: Observable<ApiEnvelope<T>> = source;

    if (retryOnNetworkFailure) {
      // A write that timed out may already have been processed with only the
      // answer lost — re-sending it could record the same action twice. So the
      // retry is GET-only, and only when no reply arrived (status 0). Server
      // refusals are never retried; they never reach here as HttpErrorResponse.
      stream = stream.pipe(
        retry({
          count: 1,
          delay: (error: unknown) =>
            error instanceof HttpErrorResponse && error.status === 0
              ? timer(300)
              : throwError(() => error),
        }),
      );
    }

    return stream.pipe(
      map((envelope) => this.unwrap(envelope)),
      catchError((error: unknown) => throwError(() => this.toApiError(error))),
    );
  }

  private unwrap<T>(envelope: ApiEnvelope<T>): T {
    // Defensive: an endpoint that somehow escapes the wrapper filter returns a
    // bare payload. Treat it as the result rather than failing on a missing flag.
    if (envelope == null || typeof envelope !== 'object' || !('Success' in envelope)) {
      return envelope as unknown as T;
    }

    if (!envelope.Success) {
      const error = new ApiError(
        envelope.StatusCode || 400,
        envelope.ErrorMessage ?? 'Request failed.',
      );
      if (error.isUnauthorized) {
        this.onUnauthorized?.();
      }
      throw error;
    }

    return envelope.Result as T;
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    // These bypass ApiResponseWrapperFilter, so the wire status is the truth:
    // a bare 403 with an empty body from [Authorize], or a network failure.
    if (error instanceof HttpErrorResponse) {
      const apiError = new ApiError(error.status, messageForWireStatus(error));
      if (apiError.isUnauthorized) {
        this.onUnauthorized?.();
      }
      return apiError;
    }

    return new ApiError(0, error instanceof Error ? error.message : 'Unexpected error.');
  }
}

function messageForWireStatus(error: HttpErrorResponse): string {
  // The body may still carry an envelope (e.g. a pre-pipeline failure).
  const body = error.error as Partial<ApiEnvelope<unknown>> | string | null;
  if (body && typeof body === 'object' && typeof body.ErrorMessage === 'string') {
    return body.ErrorMessage;
  }

  switch (error.status) {
    case 0:
      return 'Cannot reach the server. Check your network connection.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'That endpoint does not exist on the server yet.';
    case 405:
      return 'That operation is not available on the server yet.';
    default:
      return error.message || `Request failed with status ${error.status}.`;
  }
}

/** Drops null/undefined/'' so empty filters never reach the query string. */
export function toHttpParams(params?: QueryParams): HttpParams {
  let httpParams = new HttpParams();
  if (!params) {
    return httpParams;
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    httpParams = httpParams.set(key, String(value));
  }

  return httpParams;
}
