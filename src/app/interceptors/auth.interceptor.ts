import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Exclure les endpoints qui n'ont pas besoin d'authentification
  if (req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/refresh')) {
    return next(req);
  }

  const token = authService.getToken();
  
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expiré - tentative de refresh automatique
          console.log('🔄 Token expiré, refresh automatique...');
          
          return authService.refreshToken().pipe(
            switchMap(() => {
              // Retry la requête avec le nouveau token
              const newToken = authService.getToken();
              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${newToken}`)
              });
              console.log('✅ Retry avec nouveau token');
              return next(retryReq);
            }),
            catchError((refreshError) => {
              // Si le refresh échoue, déconnecter
              console.log('❌ Refresh échoué, déconnexion');
              authService.logout();
              return throwError(() => error);
            })
          );
        }
        
        if (error.status === 403) {
          // Permissions insuffisantes
          console.log('❌ Permissions insuffisantes');
          authService.logout();
        }
        
        return throwError(() => error);
      })
    );
  }

  // Si pas de token, laisser passer (le serveur décidera)
  return next(req);
};
