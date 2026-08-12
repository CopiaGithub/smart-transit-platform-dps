import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from '../../core/api/api.service';
import { StorageService } from '../storage/storage.service';

/** apps/backend/Services/AuthService/LoginModel.cs — no user object comes back. */
interface LoginResponse {
  Token: string;
  TokenExpiresAt: string;
}

/**
 * Claims embedded in the JWT. This is the only place user identity comes from —
 * the login response deliberately carries nothing but the token.
 */
interface JwtClaims {
  userId?: string | number;
  name?: string;
  emailId?: string;
  employeeCode?: string;
  roleId?: string | number;
  roleName?: string;
  /** Seconds since epoch. */
  exp?: number;
}

export interface AuthUser {
  id: number | null;
  name: string;
  emailId: string | null;
  employeeCode: string | null;
  roleId: number | null;
  roleName: string;
}

/**
 * Roles in role_master. A guard's post is part of the role name — there is no
 * separate gate field on the user record, and there is no "Security" role.
 */
export const ROLE = {
  Admin: 'Admin',
  Teacher: 'Teacher',
  Parent: 'Parent',
  Gate6Operator: 'Gate 6 Operator',
  Gate1Operator: 'Gate 1 Operator',
} as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);

  private readonly tokenKey = 'authToken';
  private readonly tokenExpiryKey = 'authTokenExpiresAt';
  private readonly userKey = 'userData';
  private readonly idKey = 'id';
  private readonly roleIdKey = 'roleId';
  private readonly roleKey = 'roleName';
  private readonly rememberedUsernameKey = 'rememberedUsername';

  constructor() {
    // ApiService signs the user out on a 401 without depending on this service,
    // which would be a DI cycle.
    this.api.setUnauthorizedHandler(() => this.logout());
  }

  /**
   * The server checks email, employee code and mobile number with an OR, so this
   * is one identifier field — never three.
   *
   * Failures surface as a thrown ApiError carrying the server's ErrorMessage.
   */
  login(username: string, password: string): Observable<AuthUser> {
    return this.api
      .post<LoginResponse>('/Auth/login', { Username: username, Password: password })
      .pipe(
        tap((response) => this.saveSession(response)),
        map((response) => this.claimsToUser(decodeClaims(response.Token))),
      );
  }

  private saveSession(response: LoginResponse): void {
    const claims = decodeClaims(response.Token);
    const user = this.claimsToUser(claims);

    // localStorage, not sessionStorage: sessionStorage is per-tab and dies with
    // the tab, so closing the browser — or opening the console in a second tab —
    // asked the user to sign in again for no reason anyone could see.
    //
    // The token still expires on its own (JwtSettings.AccessTokenExpiryMinutes),
    // and clearSession wipes both storages, so signing out is still a real sign
    // out. This only stops the session evaporating while it is still valid.
    this.storage.useLocalStorage();
    this.storage.setItem(this.tokenKey, response.Token);
    this.storage.setItem(this.tokenExpiryKey, response.TokenExpiresAt ?? '');
    this.storage.setItem(this.userKey, JSON.stringify(user));
    this.storage.setItem(this.idKey, String(user.id ?? ''));
    this.storage.setItem(this.roleIdKey, String(user.roleId ?? ''));
    this.storage.setItem(this.roleKey, user.roleName);
  }

  private claimsToUser(claims: JwtClaims): AuthUser {
    return {
      id: toNumber(claims.userId),
      name: claims.name ?? '',
      emailId: claims.emailId ?? null,
      employeeCode: claims.employeeCode ?? null,
      roleId: toNumber(claims.roleId),
      roleName: claims.roleName ?? '',
    };
  }

  /**
   * A stored token whose expiry has passed is treated as absent, so an expired
   * session never even reaches a request.
   */
  getToken(): string | null {
    const token = this.storage.getItem(this.tokenKey);
    if (!token) {
      return null;
    }

    if (this.isSessionExpired()) {
      this.clearSession();
      return null;
    }

    return token;
  }

  private isSessionExpired(): boolean {
    const expiresAt = this.storage.getItem(this.tokenExpiryKey);
    if (!expiresAt) {
      return false;
    }

    const expiryMs = Date.parse(expiresAt);
    return Number.isFinite(expiryMs) && expiryMs <= Date.now();
  }

  getUserData(): AuthUser | null {
    const raw = this.storage.getItem(this.userKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  getId(): number | null {
    return this.getUserData()?.id ?? null;
  }

  getRole(): string | undefined {
    return this.getUserData()?.roleName || undefined;
  }

  isAdmin(): boolean {
    return this.getRole() === ROLE.Admin;
  }

  private clearSession(): void {
    this.storage.clear([this.rememberedUsernameKey]);
  }

  logout(): void {
    this.clearSession();
    window.location.href = '/login';
  }
}

function decodeClaims(token: string): JwtClaims {
  try {
    // Payload only — the server verifies the signature.
    return jwtDecode<JwtClaims>(token);
  } catch {
    return {};
  }
}

function toNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
