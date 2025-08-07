import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, throwError, switchMap, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Flag global pour éviter les appels multiples de refresh
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {

   const injector = inject(Injector);
  const authService = injector.get(AuthService);
  
  // Exclure les endpoints qui n'ont pas besoin d'authentification
  if (req.url.includes('/login') || req.url.includes('/logout') || req.url.includes('/register') || req.url.includes('/refresh_token') || req.url.includes('/check_login')) {
    return next(req);
  }

  const authReq = req.clone({
    withCredentials: true // Les cookies httpOnly sont automatiquement inclus
  });
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing) {
        // Token expiré - tentative de refresh automatique
        console.log('🔄 Token expiré (401), refresh automatique...');
        isRefreshing = true;

        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry la requête - les nouveaux cookies sont automatiquement utilisés
            console.log('✅ Retry avec nouveaux cookies');
            isRefreshing = false;
            return next(authReq); // Même requête, nouveaux cookies
          }),
          catchError((refreshError) => {
            // Si le refresh échoue, déconnecter
            console.log('❌ Refresh échoué, déconnexion forcée');
            isRefreshing = false;
            authService.forceLogout();
            return EMPTY; // Retourne un observable vide pour stopper la chaîne
          })
        );
      } else if (error.status === 401 && isRefreshing) {
        // Si un refresh est déjà en cours, on ignore cette erreur
        console.log('🚫 Refresh déjà en cours, requête ignorée');
        return EMPTY;
      }
      return throwError(() => error);
    })
  );
};
