import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
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
    VALIDATE_TOKEN: '/validate-token',
    USER_PROFILE: '/users/profile'
  }
} as const;

const TOKEN_CONFIG = {
  STORAGE_KEY: 'auth_token',
  CHECK_INTERVAL: 60000 // 1 minute
} as const;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ===== PROPRIÉTÉS PRIVÉES =====
  private readonly tokenKey = TOKEN_CONFIG.STORAGE_KEY;
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private tokenCheckInterval: Subscription | null = null;
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
    this.stopPeriodicValidation();
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
   * Vérification manuelle de l'authentification côté serveur
   * @returns Observable<boolean> - True si authentifié, false sinon
   */
  isAuthenticated(): Observable<boolean> {
    this.ensureInitialized();
    
    if (!this.hasToken()) {
      return of(false);
    }
    return this.validateTokenWithServer();
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
    
    if (!token) {
      this.updateAuthenticationState(false);
      return;
    }

    this.validateTokenWithServer().subscribe({
      next: (isValid) => this.handleAuthenticationValidation(isValid),
      error: (error) => this.handleAuthenticationError(error)
    });
  }

  /**
   * Gérer le résultat de la validation d'authentification
   * @param isValid - Résultat de la validation
   */
  private handleAuthenticationValidation(isValid: boolean): void {
    if (isValid) {
      console.log('Utilisateur authentifié détecté au démarrage');
      this.updateAuthenticationState(true);
      this.startPeriodicValidation();
    } else {
      console.log('Token invalide détecté au démarrage');
      this.handleTokenExpiry();
    }
  }

  /**
   * Gérer les erreurs d'authentification
   * @param error - L'erreur survenue
   */
  private handleAuthenticationError(error: any): void {
    console.error('Erreur lors de la validation du token au démarrage:', error);
    this.handleTokenExpiry();
  }

  // ===== MÉTHODES DE VALIDATION PÉRIODIQUE =====
  
  /**
   * Démarrer la validation périodique du token
   */
  private startPeriodicValidation(): void {
    this.stopPeriodicValidation();
    
    this.tokenCheckInterval = interval(TOKEN_CONFIG.CHECK_INTERVAL).pipe(
      switchMap(() => this.isAuthenticated())
    ).subscribe({
      next: (isValid) => {
        if (!isValid) {
          console.log('Token expiré détecté lors de la validation périodique');
          this.handleTokenExpiry();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la validation périodique:', error);
        this.handleTokenExpiry();
      }
    });
  }

  /**
   * Arrêter la validation périodique du token
   */
  private stopPeriodicValidation(): void {
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
      this.tokenCheckInterval = null;
    }
  }

  // ===== MÉTHODES API =====

  /**
   * Valider le token côté serveur
   * @returns Observable<boolean> - True si le token est valide
   */
  private validateTokenWithServer(): Observable<boolean> {
    return this.http.get<any>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VALIDATE_TOKEN}`).pipe(
      map((response) => this.isValidTokenResponse(response)),
      catchError(error => {
        console.error('Validation du token échouée:', error);
        this.handleTokenExpiry();
        return of(false);
      })
    );
  }

  // ===== MÉTHODES UTILITAIRES PRIVÉES =====
  
  /**
   * Gérer une connexion réussie
   * @param token - Le token JWT reçu
   */
  private handleSuccessfulLogin(token: string): void {
    this.setToken(token);
    this.updateAuthenticationState(true);
    this.startPeriodicValidation();
    console.log('Utilisateur connecté avec succès');
  }

  /**
   * Gérer l'expiration du token
   */
  private handleTokenExpiry(): void {
    this.stopPeriodicValidation();
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

  /**
   * Vérifier si la réponse du serveur indique un token valide
   * @param response - La réponse du serveur
   * @returns True si le token est valide selon le serveur
   */
  private isValidTokenResponse(response: any): boolean {
    if (response && (response.valid === true || response.status === 'ACCEPTED')) {
      return true;
    } else {
      this.handleTokenExpiry();
      return false;
    }
  }
}
