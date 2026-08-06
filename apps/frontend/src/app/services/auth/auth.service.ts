import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { StorageService } from '../storage/storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiUrl + '/Auth';
  private refreshUrl = environment.apiUrl + '/Auth/refresh';
  private tokenKey = 'authToken';
  private refreshTokenKey = 'refreshToken';
  private userKey = 'userData';
  private idKey = 'id';
  private roleId = 'roleId';
  private rememberedUsernameKey = 'rememberedUsername';
  private roleKey = 'roleName';

  isRefreshing = false;

  constructor(
    private http: HttpClient,
    private storage: StorageService,
  ) {}

  /**
   * Stub login for basic scaffold — replace with real API call later.
   * Accepts any non-empty username/password and stores a demo session.
   */
  login(username: string, password: string): Observable<any> {
    if (!username?.trim() || !password?.trim()) {
      return of({ success: false, message: 'Username and password are required' });
    }

    // TODO: wire to backend — return this.http.post(this.baseUrl, { username, password });
    return of({
      success: true,
      token: 'demo-token',
      refreshToken: 'demo-refresh-token',
      user: {
        id: 1,
        name: username,
        roleId: 1,
        roleName: 'Admin',
        dealerId: null,
      },
      isPrinciple: true,
      stateId: null,
    }).pipe(delay(300));
  }

  saveAuthData(
    token: string,
    refreshToken: string,
    user: any,
    stateId: any,
    isPrinciple: boolean,
  ): void {
    this.storage.useSessionStorage();
    const { password, ...safeUserData } = user;

    this.storage.setItem(this.tokenKey, token);
    this.storage.setItem(this.refreshTokenKey, refreshToken);
    this.storage.setItem(this.userKey, JSON.stringify(safeUserData));
    this.storage.setItem(this.idKey, String(user.id));
    this.storage.setItem(this.roleId, String(user.roleId));
    this.storage.setItem('isPrinciple', JSON.stringify(isPrinciple));
    if (stateId != null) {
      this.storage.setItem('stateId', String(stateId));
    }
    if (user.roleName) {
      this.storage.setItem(this.roleKey, user.roleName);
    }
  }

  getToken(): string | null {
    return this.storage.getItem(this.tokenKey);
  }

  saveToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, token);
  }

  saveRefreshToken(token: string): void {
    sessionStorage.setItem(this.refreshTokenKey, token);
  }

  refreshToken() {
    return this.http.post(this.refreshUrl, {
      accessToken: sessionStorage.getItem(this.tokenKey),
      refreshToken: sessionStorage.getItem(this.refreshTokenKey),
    });
  }

  getUserData(): any {
    const userData = this.storage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  getId(): number | null {
    const id = this.storage.getItem(this.idKey);
    return id ? +id : null;
  }

  logout(): void {
    this.storage.clear([this.rememberedUsernameKey]);
    window.location.href = '/login';
  }

  getRole(): string | undefined {
    const user = this.getUserData();
    return user ? user.roleName : undefined;
  }
}
