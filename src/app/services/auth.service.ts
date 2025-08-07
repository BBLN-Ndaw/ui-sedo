import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Location } from '@angular/common';

// ===== INTERFACES =====
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

// ===== CONSTANTES =====
const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  ENDPOINTS: {
    LOGIN: '/login',
    REFRESH: '/refresh_token',
    LOGOUT: '/logout',
    CHECK_LOGIN: '/check_login',
    USER_PROFILE: '/users/profile'
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

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
          if (response.success === true) {
            this.updateAuthenticationState(true);
          }
        }),
        catchError(error => {
          console.error('Erreur lors de la connexion:', error);
          throw error;
        })
      );
  }

  /**
   * Déconnecter l'utilisateur
   */
logout(): void {
    this.http.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`, {}, {
      withCredentials: true  // Important pour que les cookies soient envoyés
    }).subscribe({
      next: () => {
        console.log('Logout côté serveur réussi');
        this.updateAuthenticationState(false);
        this.router.navigate(['/login']);
      },
      error: (error) => console.warn('Erreur logout serveur:', error)
    });
}

  /**
   * Forcer la déconnexion sans appel serveur (pour éviter les boucles)
   */
  forceLogout(): void {
    console.log('🚪 Déconnexion forcée');
    this.updateAuthenticationState(false);
    this.router.navigate(['/login']);
  }

  /**
   * Rafraîchir l'access token en utilisant le refresh token
   * @returns Observable<LoginResponse> - Réponse du refresh
   */
  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH}`, {}, {
      withCredentials: true // Pour envoyer le refresh token en cookie et recevoir le nouveau access token
    }).pipe(
      tap(response => {
        if (response.success === true) {
          console.log('Token rafraîchi avec succès - nouveaux cookies reçus');
          this.updateAuthenticationState(true);
        }
      }),
      catchError(error => {
        console.error('Erreur lors du refresh du token:', error);
        // NE PAS appeler logout() ici pour éviter les boucles
        this.updateAuthenticationState(false);
        throw error;
      })
    );
  }

  /**
   * verifier si l'utilisateur est connecté
   */
  checkLoginStatus(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHECK_LOGIN}`, {
      withCredentials: true // Pour vérifier l'état de la session avec les cookies httpOnly
    }).pipe(
      tap(response => {
        if (response.success === true && response.message ==='SUCCESS') {
          console.log('session active - utilisateur connecté');
          this.updateAuthenticationState(true);
        }
        else {
          console.log('session inactive - utilisateur non connecté');
          this.updateAuthenticationState(false);
        }
      }),
         catchError(error => {
        console.error('Erreur lors de la verification du statut de connexion:', error);
        this.updateAuthenticationState(false);
        throw error;
      })
    );
  }

  /**
   * Mettre à jour l'état d'authentification
   * @param isAuthenticated - Nouvel état d'authentification
   */
  private updateAuthenticationState(isAuthenticated: boolean): void {
    this.isAuthenticatedSubject.next(isAuthenticated);
  }

  /**
   * Naviguer vers la page de connexion
   */
  private navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  private isPublicRoute(url: string): boolean {
  const publicRoutes = ['/login', '/register'];
  return publicRoutes.some(route => url.startsWith(route));
}

  silentAuthInit(): Observable<LoginResponse> {
  const location = inject(Location);
  const currentPath = location.path();

    console.debug('current path:', currentPath);
  if (this.isPublicRoute(currentPath)) {
    console.debug('[Auth] Public route, skip auth check:', currentPath);
    this.updateAuthenticationState(false);
    return of({ success: false, message: 'REJECTED' });
  }
  
  // Faire uniquement une vérification silencieuse sans redirection automatique
  return this.checkLoginStatus().pipe(
    catchError((error) => {
      console.debug('[Auth] Silent auth failed, user will need to login manually');
      this.updateAuthenticationState(false);
      return of({ success: false, message: 'REJECTED' });
    })
  );
}


}
