import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, first, map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  /**
   * Empêche l'accès à la page de login si l'utilisateur est déjà connecté
   * @returns true si l'accès est autorisé, false sinon
   */

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.accessToken$.pipe(
      first(),
      switchMap(token => {
        if (token) {
          console.log('Utilisateur déjà connecté - Redirection vers dashboard');
          this.router.navigate(['/dashboard']);
          return of(false);
        } 
         console.log('Accès autorisé à la page de login');
        return of(true);
      })
    );
  }
}
