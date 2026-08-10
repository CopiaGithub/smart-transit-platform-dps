import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpEvent,
  HttpInterceptorFn,
  HttpHandlerFn,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

/**
 * Escape hatch for the endpoints the server marks [AllowAnonymous] — the LED
 * board renderer and the display heartbeat, which run with no login at all.
 */
export const SKIP_AUTH_HEADER = 'X-Skip-Auth';

/**
 * Attaches the bearer token. Nothing else.
 *
 * Session handling deliberately does NOT live here: this API answers HTTP 200
 * for every failure and puts the real status inside the body, so an expired
 * token never arrives as an HttpErrorResponse. ApiService reads the envelope's
 * StatusCode and signs the user out on 401 — implemented once, there.
 *
 * 403 is a normal, frequent answer on this backend because the roles are
 * deliberately separated. It must never sign anyone out: doing so throws a gate
 * operator off shift for tapping the wrong screen.
 *
 * There is no token-refresh flow — AuthController exposes only POST /Auth/login.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (req.headers.has(SKIP_AUTH_HEADER)) {
    return next(req.clone({ headers: req.headers.delete(SKIP_AUTH_HEADER) }));
  }

  const token = inject(AuthService).getToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};
