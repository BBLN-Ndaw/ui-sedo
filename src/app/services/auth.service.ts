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
  token: string;
}

// ===== CONSTANTES =====
const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  ENDPOINTS: {
    LOGIN: '/login',
    USER_PROFILE: '/users/profile'
  }
} as const;

const TOKEN_CONFIG = {
  STORAGE_KEY: 'auth_token'
} as const;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ===== PROPRIÉTÉS PRIVÉES =====
  private readonly tokenKey = TOKEN_CONFIG.STORAGE_KEY;
  
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
    return this.http.post<LoginResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, credentials)
      .pipe(
        tap(response => {
          if (response?.token) {
            this.handleSuccessfulLogin(response.token);
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
    this.clearStoredToken();
    this.updateAuthenticationState(false);
    this.navigateToLogin();
    console.log('Utilisateur déconnecté');
  }

  // ===== MÉTHODES DE GESTION DES TOKENS =====
  
  /**
   * Récupérer le token stocké
   * @returns Le token JWT ou null
   */
  getToken(): string | null {
    this.ensureInitialized();
    
    if (this.isClientSide()) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
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
  
  private setToken(token: string): void {
    if (this.isClientSide()) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  private clearStoredToken(): void {
    if (this.isClientSide()) {
      localStorage.removeItem(this.tokenKey);
    }
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private isClientSide(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
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
    const token = this.getToken();
    
    if (token) {
      console.log('Token détecté au démarrage');
      this.updateAuthenticationState(true);
    } else {
      this.updateAuthenticationState(false);
    }
  }

  // ===== MÉTHODES UTILITAIRES PRIVÉES =====
  
  /**
   * Gérer une connexion réussie
   * @param token - Le token JWT reçu
   */
  private handleSuccessfulLogin(token: string): void {
    this.setToken(token);
    this.updateAuthenticationState(true);
    console.log('Utilisateur connecté avec succès');
  }

  /**
   * Gérer l'expiration du token
   */
  private handleTokenExpiry(): void {
    this.clearStoredToken();
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
