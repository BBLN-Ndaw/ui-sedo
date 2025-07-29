import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { of } from 'rxjs';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api';
  private tokenKey = 'auth_token';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Vérifier l'état d'authentification au démarrage
    this.checkAuthenticationStatus();
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  isAuthenticated(): boolean {
    return this.hasToken() && this.isTokenValid();
  }

  // Vérifier si le token est valide (non expiré)
  private isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Décoder le JWT pour vérifier l'expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        // Token expiré, le supprimer
        this.handleTokenExpiry();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token invalide:', error);
      this.handleTokenExpiry();
      return false;
    }
  }

  // Gérer l'expiration du token
  private handleTokenExpiry(): void {
    localStorage.removeItem(this.tokenKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  // Vérifier le statut d'authentification au démarrage
  private checkAuthenticationStatus(): void {
    const isAuth = this.isAuthenticated();
    this.isAuthenticatedSubject.next(isAuth);
    
    if (!isAuth && this.getToken()) {
      // Token présent mais invalide/expiré
      console.log('Token expiré ou invalide détecté au démarrage');
      this.handleTokenExpiry();
    }
  }

  // Valider le token côté serveur (optionnel mais recommandé)
  validateTokenWithServer(): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/validate-token`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.isAuthenticatedSubject.next(true);
      }),
      catchError(error => {
        console.error('Validation du token échouée:', error);
        this.handleTokenExpiry();
        return of(false);
      })
    );
  }
}
