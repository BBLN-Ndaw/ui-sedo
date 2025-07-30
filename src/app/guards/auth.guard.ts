import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
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
  canActivate(): Observable<boolean> {
    console.log("Vérification d'authentification dans le guard");
    
    // Utiliser isAuthenticated() qui fait une vérification active du token
    return this.authService.isAuthenticated().pipe(
      take(1),
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          console.log('Accès refusé - Redirection vers login');
          this.router.navigate(['/login']);
        } else {
          console.log('Accès autorisé - Utilisateur authentifié');
        }
      }),
      map(isAuthenticated => isAuthenticated)
    );
  }
}
