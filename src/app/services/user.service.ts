import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { RequestPasswordResetRequestDto, RequestPasswordResetResponseDto, UpdatePasswordDto, User, UserFilterOptions, UserListResponse, UserRole } from '../shared/models';

// ===== INTERFACES =====

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserResponse {
  user: User;
  message?: string;
}

// ===== CONSTANTES =====
const USER_API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  ENDPOINTS: {
    USERS: '/users',
    STATUS: '/users/status',
    PROFILE: '/users/profile',
    REQUEST_PASSWORD_RESET: '/request-password-reset',
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
  ) {}

  // ===== MÉTHODES DE GESTION DU PROFIL UTILISATEUR =====
  
  /**
   * Récupérer le profil de l'utilisateur connecté
   * @returns Observable<User> - Le profil utilisateur
   */
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.PROFILE}`, {
      withCredentials: true
    }).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.currentUserSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  updateUserById(id: string, updatedUser: User): Observable<User> {
    return this.http.put<User>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}/${id}`, updatedUser, {
      withCredentials: true
    })
  }

  updatePassword(id: string, changePasswordRequest: ChangePasswordRequest): Observable<UpdatePasswordDto> {
    return this.http.put<UpdatePasswordDto>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}/${id}/password`, changePasswordRequest, {
      withCredentials: true
    })
  }

   /**
   * Demander une réinitialisation de mot de passe lorsqu'on a oublié son mot de passe
   * @param email - L'email de l'utilisateur
   * @returns Observable<{message: string}> - La réponse du serveur
   */
  requestPasswordReset(requestPasswordResetRequestDto: RequestPasswordResetRequestDto): Observable<RequestPasswordResetResponseDto> {
    return this.http.post<RequestPasswordResetResponseDto>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}${USER_API_CONFIG.ENDPOINTS.REQUEST_PASSWORD_RESET}`, requestPasswordResetRequestDto );
  }

    /**
   * Récupère la liste des utilisateurs avec pagination et filtres
   */
  getUsers(
    page: number = 0,
    size: number = 20,
    filters: UserFilterOptions = {}
  ): Observable<UserListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // Ajouter les filtres de recherche EN PLUS des paramètres de pagination
    params = this.addSearchParam(page, size, filters);

    return this.http.get<UserListResponse>(
      `${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}`,
      { params: params, withCredentials: true }
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(
      `${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}/all`,
      { withCredentials: true }
    );
  }

   addSearchParam(
    page: number = 0,
    size: number = 20,
    filters: UserFilterOptions
  ): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.isActive !== undefined) {
      params = params.set('isActive', filters.isActive.toString());
    }
    if (filters.hasOrders !== undefined) {
      params = params.set('hasOrders', filters.hasOrders.toString());
    }
    return params;
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(
      `${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}/${id}`,{ withCredentials: true }
    );
  }

  updateUserStatus(id: number, action: 'activate' | 'deactivate'): Observable<User> {
    const statusAction = {value: action};
    return this.http.put<User>(
      `${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.STATUS}/${id}`, statusAction, { withCredentials: true }
    );
  }

  /**
   * Créer un nouvel utilisateur
   */
  createUser(createUserRequest: User): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      `${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}`,
      createUserRequest,
      { withCredentials: true }
    )
  }

  /**
   * Supprimer un utilisateur (admin uniquement)
   */
  deleteUser(id: number): Observable<User> {
    return this.http.delete<User>(
      `${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}/${id}`,
      { withCredentials: true }
    )
  }
}
