import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { User, UserRole } from '../shared/models';
import { AuthService } from './auth.service';

// ===== INTERFACES =====
export interface CreateUserRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  roles?: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserResponse {
  user: User;
  message?: string;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  size: number;
}

// ===== CONSTANTES =====
const USER_API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  ENDPOINTS: {
    USERS: '/users',
    PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    ACTIVATE: '/users/activate',
    DEACTIVATE: '/users/deactivate'
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // ===== PROPRIÉTÉS PRIVÉES =====
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  // ===== PROPRIÉTÉS PUBLIQUES =====
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  // ===== CONSTRUCTEUR =====
  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {
    // Écouter les changements d'authentification
    this.initializeUserData();
  }

  // ===== MÉTHODES DE GESTION DU PROFIL UTILISATEUR =====
  
  /**
   * Récupérer le profil de l'utilisateur connecté
   * @returns Observable<User> - Le profil utilisateur
   */
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.PROFILE}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        console.log('Profil utilisateur chargé:', user.username);
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.currentUserSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mettre à jour le profil de l'utilisateur connecté
   * @param updateData - Données à mettre à jour
   * @returns Observable<UserResponse> - Réponse avec utilisateur mis à jour
   */
  updateCurrentUserProfile(updateData: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.PROFILE}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.user) {
          this.currentUserSubject.next(response.user);
          console.log('Profil mis à jour avec succès');
        }
      }),
      catchError(error => {
        console.error('Erreur lors de la mise à jour du profil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Changer le mot de passe de l'utilisateur connecté
   * @param passwordData - Données du changement de mot de passe
   * @returns Observable<{message: string}> - Message de confirmation
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<{message: string}> {
    // Validation côté client
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return throwError(() => new Error('Les mots de passe ne correspondent pas'));
    }

    return this.http.post<{message: string}>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.CHANGE_PASSWORD}`, {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    }, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('Mot de passe changé avec succès');
      }),
      catchError(error => {
        console.error('Erreur lors du changement de mot de passe:', error);
        return throwError(() => error);
      })
    );
  }

  // ===== MÉTHODES DE GESTION DES UTILISATEURS (ADMIN) =====
  
  /**
   * Récupérer la liste de tous les utilisateurs (Admin seulement)
   * @param page - Numéro de page (optionnel)
   * @param size - Taille de page (optionnel)
   * @returns Observable<UsersListResponse> - Liste paginée des utilisateurs
   */
  getAllUsers(page: number = 0, size: number = 10): Observable<UsersListResponse> {
    const params = { page: page.toString(), size: size.toString() };
    
    return this.http.get<UsersListResponse>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}`, {
      headers: this.authService.getAuthHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer un utilisateur par son ID
   * @param userId - ID de l'utilisateur
   * @returns Observable<User> - Utilisateur trouvé
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}/${userId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Créer un nouveau utilisateur (Admin seulement)
   * @param userData - Données du nouvel utilisateur
   * @returns Observable<UserResponse> - Utilisateur créé
   */
  createUser(userData: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}`, userData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('Utilisateur créé avec succès:', response.user?.username);
      }),
      catchError(error => {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mettre à jour un utilisateur (Admin seulement)
   * @param userId - ID de l'utilisateur à mettre à jour
   * @param updateData - Données à mettre à jour
   * @returns Observable<UserResponse> - Utilisateur mis à jour
   */
  updateUser(userId: string, updateData: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}/${userId}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('Utilisateur mis à jour avec succès:', response.user?.username);
      }),
      catchError(error => {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Activer un utilisateur (Admin seulement)
   * @param userId - ID de l'utilisateur à activer
   * @returns Observable<UserResponse> - Utilisateur activé
   */
  activateUser(userId: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.ACTIVATE}/${userId}`, {}, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('Utilisateur activé avec succès:', response.user?.username);
      }),
      catchError(error => {
        console.error('Erreur lors de l\'activation de l\'utilisateur:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Désactiver un utilisateur (Admin seulement)
   * @param userId - ID de l'utilisateur à désactiver
   * @returns Observable<UserResponse> - Utilisateur désactivé
   */
  deactivateUser(userId: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.DEACTIVATE}/${userId}`, {}, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('Utilisateur désactivé avec succès:', response.user?.username);
      }),
      catchError(error => {
        console.error('Erreur lors de la désactivation de l\'utilisateur:', error);
        return throwError(() => error);
      })
    );
  }

  // ===== MÉTHODES UTILITAIRES =====
  
  /**
   * Vérifier si l'utilisateur connecté a un rôle spécifique
   * @param role - Rôle à vérifier
   * @returns boolean - True si l'utilisateur a le rôle
   */
  hasRole(role: UserRole | string): boolean {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser || !currentUser.roles) {
      return false;
    }
    return currentUser.roles.includes(role.toString());
  }

  /**
   * Vérifier si l'utilisateur connecté est administrateur
   * @returns boolean - True si admin
   */
  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  /**
   * Vérifier si l'utilisateur connecté est un employé
   * @returns boolean - True si employé
   */
  isEmployee(): boolean {
    return this.hasRole(UserRole.EMPLOYEE);
  }

  /**
   * Obtenir le nom complet de l'utilisateur connecté
   * @returns string - Nom complet ou username
   */
  getCurrentUserFullName(): string {
    const user = this.currentUserSubject.value;
    if (!user) return '';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  }

  /**
   * Rafraîchir les données de l'utilisateur connecté
   */
  refreshCurrentUser(): void {
    this.authService.isAuthenticated$.pipe(
      switchMap(isAuth => {
        if (isAuth) {
          return this.getCurrentUserProfile();
        } else {
          this.currentUserSubject.next(null);
          return [];
        }
      })
    ).subscribe({
      error: (error) => {
        console.error('Erreur lors du rafraîchissement de l\'utilisateur:', error);
      }
    });
  }

  // ===== MÉTHODES PRIVÉES =====
  
  /**
   * Initialiser les données utilisateur au démarrage
   */
  private initializeUserData(): void {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        // Charger le profil utilisateur quand connecté
        this.getCurrentUserProfile().subscribe({
          error: (error) => {
            console.error('Erreur lors du chargement initial du profil:', error);
          }
        });
      } else {
        // Nettoyer les données quand déconnecté
        this.currentUserSubject.next(null);
      }
    });
  }
}
