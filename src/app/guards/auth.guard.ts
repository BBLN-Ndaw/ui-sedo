import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map,  } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Protège les routes nécessitant une authentification
   * @returns true si l'accès est autorisé, false sinon
   */
  canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      map(() => {
        const isLoggedIn = !!this.authService.accessTokenSubject.value;
        if (!isLoggedIn) {
          this.router.navigate(['/login']);
        }
        return isLoggedIn;
      })
    );
  }
}
