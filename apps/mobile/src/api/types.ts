/**
 * Shapes shared by every endpoint. Keys are PascalCase because the API sets
 * `PropertyNamingPolicy = null` — do not "fix" them to camelCase.
 */

/**
 * The uniform envelope. Every response carries it, including failures: the
 * server's ApiResponseWrapperFilter forces HTTP 200 on the wire and puts the
 * real status inside. Nothing outside apiClient should ever see this type.
 */
export type ApiEnvelope<T> = {
  Success: boolean;
  Result: T | null;
  StatusCode: number;
  ErrorMessage: string | null;
};

export type PagedResult<T> = {
  Items: T[];
  TotalRecords: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
};

/** Query shape every list endpoint accepts. Server defaults noted per field. */
export type PagedQuery = {
  pageNumber?: number; // 1
  pageSize?: number; // 25
  searchTerm?: string;
  sortBy?: string; // name
  descending?: boolean; // false
  isActive?: boolean; // true — false includes deactivated records
};

/**
 * A failure the server chose to report. `message` is the server's own wording
 * and is written for the operator ("Bus is already in the yard for this
 * session") — show it as-is rather than substituting generic text.
 */
export class ApiError extends Error {
  readonly statusCode: number;

  /**
   * The token is gone or expired — the app must sign out.
   *
   * Deliberately 401 only. A 403 means the person is signed in perfectly well
   * and simply may not do this thing (gate roles are separated on purpose,
   * §7.1); signing them out for it would be both wrong and infuriating.
   */
  readonly isSessionExpired: boolean;

  /** Signed in, but this role may not perform the action. */
  readonly isForbidden: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isSessionExpired = statusCode === 401;
    this.isForbidden = statusCode === 403;
  }
}

/** A transport failure — no reply at all. Distinct from ApiError on purpose. */
export class NetworkError extends Error {
  constructor(message = "Cannot reach the server. Check the network and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}
