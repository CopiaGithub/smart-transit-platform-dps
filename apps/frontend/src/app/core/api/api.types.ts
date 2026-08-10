/**
 * Wire contracts for the transit-display API.
 *
 * Every endpoint answers HTTP 200 — `ApiResponseWrapperFilter` on the server
 * (apps/backend/Extensions/ApiResponseWrapperFilter.cs) forces the status to 200
 * and puts the real outcome in the body. Branch on `Success`, never on the HTTP
 * status. Keys are PascalCase: Program.cs sets PropertyNamingPolicy = null.
 *
 * Nothing outside `core/api` should ever see an `ApiEnvelope` — ApiService
 * unwraps it and screens only ever receive `Result`.
 */
export interface ApiEnvelope<T> {
  Success: boolean;
  Result: T | null;
  StatusCode: number;
  ErrorMessage: string | null;
}

/** apps/backend/Common/PagedResult.cs */
export interface PagedResult<T> {
  Items: T[];
  TotalRecords: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
}

/** apps/backend/Common/PaginationFilterDto.cs — accepted by every master list endpoint. */
export interface PaginationQuery {
  PageNumber?: number;
  PageSize?: number;
  SortBy?: string;
  Descending?: boolean;
  SearchTerm?: string | null;
  /** null/true = active only. Send false to also include inactive rows. */
  IsActive?: boolean | null;
}

/**
 * The single error type screens deal with. `statusCode` is the server's own
 * StatusCode from the envelope, or the wire status for the responses that
 * bypass the wrapper (a bare 403 from [Authorize], or a network failure).
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** The token is gone or expired — sign out. */
  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  /**
   * Signed in, but this role is not allowed. A normal, frequent answer here —
   * show the message and stay signed in.
   */
  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  /** No reply at all (offline, DNS, connection refused). */
  get isNetworkError(): boolean {
    return this.statusCode === 0;
  }
}
