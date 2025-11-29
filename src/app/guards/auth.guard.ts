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
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if(this.authService.isPublicRoute(state.url)) {
      return of(true);
    }
    return this.authService.initialized$.pipe(
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
