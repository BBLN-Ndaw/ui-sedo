import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne pas ajouter le token à la requête de login
    if (req.url.includes('/login')) {
      return next.handle(req);
    }

    const token = this.authService.getToken();
    
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      
      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // Si le serveur retourne 401 (Unauthorized), le token est expiré/invalide
          if (error.status === 401) {
            console.log('Token expiré détecté par le serveur (401)');
            this.authService.logout();
          }
          return throwError(() => error);
        })
      );
    }

    return next.handle(req);
  }
}
