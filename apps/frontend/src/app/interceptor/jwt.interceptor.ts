import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpEvent,
  HttpInterceptorFn,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !auth.isRefreshing) {
        auth.isRefreshing = true;
        return auth.refreshToken().pipe(
          switchMap((res: any) => {
            auth.isRefreshing = false;
            auth.saveToken(res.token);
            auth.saveRefreshToken(res.refreshToken);
            const newReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.token}` },
            });
            return next(newReq);
          }),
          catchError((err) => {
            auth.isRefreshing = false;
            auth.logout();
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
