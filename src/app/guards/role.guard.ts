import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../shared/models';

interface JwtPayload {
  userName: string;
  roles: UserRole[];
}


@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

   constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {

    const token = this.authService.accessTokenSubject.value;
     if (!token) {
      this.router.navigate(['/catalog']);
      return false;
    }

    try {
      const payload = jwt_decode<JwtPayload>(token);
      const userRoles = payload.roles;
      const allowedRoles = route.data['roles'] as UserRole[];
      if (allowedRoles.some(role => userRoles.includes(role))) {
        return true;
      } else {
        this.router.navigate(['/catalog']);
        return false;
      }

    } catch (e) {
      console.log('JWT invalide', e);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
function jwt_decode<T>(token: string): T {
    const payload = token.split('.')[1];
    if (!payload) throw new Error('Invalid token format');
    return JSON.parse(atob(payload));
}

