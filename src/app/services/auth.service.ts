import { inject, Injectable, PLATFORM_ID, REQUEST } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

// ===== INTERFACES =====
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
}

export interface CreatePasswordDto {
  token: string;
  password: string;
}

// ===== CONSTANTES =====
const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/auth',
  ENDPOINTS: {
    LOGIN: '/login',
    REFRESH: '/refresh_token',
    LOGOUT: '/logout',
    CHECK_LOGIN: '/check_login',
    CREATE_PASSWORD: '/create-password',
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  public accessTokenSubject = new BehaviorSubject<string|null>(null);

  public readonly accessToken$ = this.accessTokenSubject.asObservable();

  // flag pour indiquer que l'initApp (APP_INITIALIZER) est terminé
  private initializedSubject = new BehaviorSubject<boolean>(false);
  initialized$ = this.initializedSubject.asObservable();

  constructor(
    private readonly http: HttpClient, 
    private readonly router: Router
  ) {
  }

  /**
   * Connecter un utilisateur avec ses identifiants
   * @param credentials - Les identifiants de connexion
   * @returns Observable<LoginResponse> - La réponse de connexion
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, credentials, {
      withCredentials: true // Pour les cookies httpOnly
    })
      .pipe(
        tap(response => {
          if (response.success === true && response.token) {
            this.updateAccessTokenState(response.token);
          }
        }),
        catchError(error => {
          console.error('Erreur de connexion:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Déconnecter l'utilisateur
  */
  logout(): Observable<LoginResponse> {
    this.accessTokenSubject.next(null);
    this.initializedSubject.next(true);
    return this.http.post<LoginResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`, {}, {withCredentials: true})
  }

  /**
   * @description Rafraîchir l'access token en utilisant le refresh token
   * refreshToken appelé depuis interceptor ou APP_INITIALIZER
   * utilise withCredentials pour envoyer les cookies httpOnly  
   * @param {string} refreshToken - Le token de rafraîchissement
   * @returns {Observable<LoginResponse>} - Observable contenant la réponse du rafraîchissement
   * @returns Observable<LoginResponse> - Réponse du refresh
  */
  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH}`, {}, {
      withCredentials: true 
    }).pipe(
      tap(response => {
        if (response.success === true && response.token) {
          console.log('Token rafraîchi avec succès - nouveaux cookies reçus');
          this.updateAccessTokenState(response.token);
          this.initializedSubject.next(true); // Indique que l'initialisation est terminée
        }
      }), catchError(error => {
        this.logout().subscribe({
          next: () => this.navigateToLogin(),
          error: () => this.navigateToLogin()
        });
        return of({ success: false });
      })
    );
  }

  /**
   * Mettre à jour l'état d'authentification
   * @param isAuthenticated - Nouvel état d'authentification
   */
  private updateAccessTokenState(isAuthenticated: string | null): void {
    this.accessTokenSubject.next(isAuthenticated);
  }

  /**
   * Naviguer vers la page de connexion
   */
  private navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
  
  setAccessToken(token: string | null): void {
    this.updateAccessTokenState(token);
  }

  shouldSkipRefreshForPasswordCreation(): boolean {
    const platformId = inject(PLATFORM_ID);

    // ---- SERVER SIDE ----
    if (!isPlatformBrowser(platformId)) {
      const req = inject(REQUEST);
      const url = req?.url ?? '';
      if (url.includes('create-password')) {
        console.log('Skip refresh token: create-password detected (server)');
        return true;
      }
      return false;
    }

    // ---- BROWSER SIDE ----
    const url = window.location.pathname;
    if (url.includes('create-password')) {
      console.log('Skip refresh token: create-password detected (browser)');
      return true;
    }
    return false;
  }

  /**
   * Définir le mot de passe avec le token de validation
   * @param createPassword - Les données pour définir le mot de passe
   * @returns Observable<{message: string}> - La réponse du serveur
   */
  createPassword(createPassword: CreatePasswordDto): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE_PASSWORD}`, createPassword);
  }
}
