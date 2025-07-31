import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { of } from 'rxjs';

// ===== INTERFACES =====
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number; // durée en secondes
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

// ===== CONSTANTES =====
const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  ENDPOINTS: {
    LOGIN: '/login',
    REFRESH: '/refresh',
    LOGOUT: '/logout',
    USER_PROFILE: '/users/profile'
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ===== PROPRIÉTÉS PRIVÉES =====
  private accessToken: string | null = null;
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private initialized = false;

  // ===== PROPRIÉTÉS PUBLIQUES =====
  public readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // ===== CONSTRUCTEUR =====
  constructor(
    private readonly http: HttpClient, 
    private readonly router: Router
  ) {}

  // ===== MÉTHODES D'AUTHENTIFICATION =====
  
  /**
   * Connecter un utilisateur avec ses identifiants
   * @param credentials - Les identifiants de connexion
   * @returns Observable<LoginResponse> - La réponse de connexion
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, credentials, {
      withCredentials: true // Important pour les cookies httpOnly
    })
      .pipe(
        tap(response => {
          if (response?.accessToken) {
            this.handleSuccessfulLogin(response.accessToken, response.expiresIn);
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
    // Appeler l'endpoint de logout pour nettoyer le refresh token côté serveur
    this.http.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`, {}, {
      withCredentials: true
    }).subscribe({
      next: () => console.log('Logout côté serveur réussi'),
      error: (error) => console.warn('Erreur logout serveur:', error)
    });
    
    this.clearTokens();
    this.updateAuthenticationState(false);
    this.navigateToLogin();
    console.log('Utilisateur déconnecté');
  }

  // ===== MÉTHODES DE GESTION DES TOKENS =====
  
  /**
   * Récupérer l'access token en mémoire
   * @returns Le token JWT ou null
   */
  getToken(): string | null {
    this.ensureInitialized();
    return this.accessToken;
  }

  /**
   * Créer les en-têtes d'autorisation
   * @returns Les en-têtes HTTP avec ou sans token
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  // ===== MÉTHODES PRIVÉES DE GESTION DES TOKENS =====
  
  /**
   * Stocker l'access token en mémoire
   * @param token - L'access token
   */
  private setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Nettoyer tous les tokens
   */
  private clearTokens(): void {
    this.accessToken = null;
  }

  /**
   * Vérifier si on a un access token valide
   * @returns true si token présent
   */
  private hasToken(): boolean {
    return !!this.accessToken;
  }

  // ===== MÉTHODES DE VALIDATION =====
  
  /**
   * Vérifier l'état d'authentification local
   * @returns Observable<boolean> - True si authentifié localement
   */
  isAuthenticated(): Observable<boolean> {
    this.ensureInitialized();
    return of(this.hasToken());
  }

  /**
   * Rafraîchir l'access token en utilisant le refresh token
   * @returns Observable<RefreshResponse> - Nouveau token
   */
  refreshToken(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH}`, {}, {
      withCredentials: true // Pour envoyer le refresh token en cookie
    }).pipe(
      tap(response => {
        if (response?.accessToken) {
          this.setAccessToken(response.accessToken);
          console.log('Token rafraîchi avec succès');
        }
      }),
      catchError(error => {
        console.error('Erreur lors du refresh du token:', error);
        this.logout(); // Si le refresh échoue, déconnecter
        throw error;
      })
    );
  }

  // ===== MÉTHODES D'INITIALISATION ET GESTION D'ÉTAT =====
  
  /**
   * Assurer que le service est initialisé (lazy initialization)
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialized = true;
      this.checkAuthenticationStatus();
    }
  }

  /**
   * Vérifier le statut d'authentification lors du démarrage de l'application
   */
  private checkAuthenticationStatus(): void {
    // Au démarrage, essayer de rafraîchir le token
    // Si on a un refresh token valide en cookie, on récupérera un nouvel access token
    this.refreshToken().subscribe({
      next: () => {
        console.log('Session restaurée avec succès');
        this.updateAuthenticationState(true);
      },
      error: () => {
        console.log('Aucune session active trouvée');
        this.updateAuthenticationState(false);
      }
    });
  }

  // ===== MÉTHODES UTILITAIRES PRIVÉES =====
  
  /**
   * Gérer une connexion réussie
   * @param accessToken - L'access token reçu
   * @param expiresIn - Durée de validité en secondes
   */
  private handleSuccessfulLogin(accessToken: string, expiresIn: number): void {
    this.setAccessToken(accessToken);
    this.updateAuthenticationState(true);
    console.log('Utilisateur connecté avec succès');
  }

  /**
   * Gérer l'expiration du token
   */
  private handleTokenExpiry(): void {
    this.clearTokens();
    this.updateAuthenticationState(false);
    this.navigateToLogin();
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
}
