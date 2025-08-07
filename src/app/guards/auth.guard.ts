import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, first, map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  /**
   * Protège les routes nécessitant une authentification
   * @returns true si l'accès est autorisé, false sinon
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.accessToken$.pipe(
      first(),
      switchMap(token => {
        if (token) {
          console.log('Token valide trouvé en mémoire');
          return of(true); // Token valide en mémoire
        } else {
          console.warn('Aucun token trouvé, tentative de rafraîchissement...');
          return this.authService.refreshToken().pipe(
            map(() => true), // Rafraîchissement réussi
            catchError(() => {
              this.router.navigate(['/login']);
              return of(false); // Rafraîchissement échoué
            })
          );
        }
      })
    );
  }}
