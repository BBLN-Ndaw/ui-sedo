import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';

import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (req.url.includes('/api/auth/refresh') || req.url.includes('/api/auth/logout')) {
    return next(req);
  }
  let accessToken: string | null = null;
  authService.accessToken$.pipe(take(1)).subscribe(token => {
      accessToken = token;
    });
  const authReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` }, withCredentials: true })
    : req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError(error => {
      if (error.status === 401) {
        // erreur 401 et ce n’est pas une requête de refresh
        return handle401(authService, router, req, next);
      }
      return throwError(() => error);
    })
  );
};

function handle401(
  authService: AuthService,
  router: Router,
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap(response => {
        isRefreshing = false;
        const newToken = response.token ?? null;
        console.log('Nouveau token:', newToken);
        refreshTokenSubject.next(newToken);
        return next(req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` },
          withCredentials: true
        }));
      }),
      catchError(err => {
        isRefreshing = false;
        // authService.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter(token => token != null),
    take(1),
    switchMap(token => next(req.clone({
      setHeaders: { Authorization: `Bearer ${token!}` },
      withCredentials: true
    })))
  );
}
