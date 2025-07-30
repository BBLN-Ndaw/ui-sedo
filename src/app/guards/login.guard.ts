import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
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
  canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1), // Prendre seulement la première valeur pour éviter les subscriptions multiples
      map(isAuthenticated => {
        if (isAuthenticated) {
          // Utilisateur déjà connecté → rediriger vers dashboard
          this.router.navigate(['/dashboard']);
          return false;
        }
        // Utilisateur non connecté → autoriser l'accès au login
        return true;
      })
    );
  }
}
