import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  if (req.url.includes('/login')) {
    return next(req);
  }

  const token = authService.getToken();
  
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si le serveur retourne 401 (Unauthorized), le token est expiré/invalide
        if (error.status === 401) {
          console.log('Token expiré détecté par le serveur (401)');
          authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
