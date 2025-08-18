import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { UpdatePasswordDto, User, UserRole } from '../shared/models';
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

  updateUser(id: string, updatedUser: User): Observable<User> {
    return this.http.put<User>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}/${id}`, updatedUser, {
      withCredentials: true
    }).pipe(
      tap(updatedUser => {
        this.currentUserSubject.next(updatedUser);
      }),
      catchError(error => {
        console.error('Erreur lors de la mise à jour du profil:', error);
        return throwError(() => error);
      })
    );
  }

  updatePassword(id: string, changePasswordRequest: ChangePasswordRequest): Observable<UpdatePasswordDto> {
    return this.http.put<UpdatePasswordDto>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.USERS}/${id}/password`, changePasswordRequest, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la mise à jour du mot de passe:', error);
        return throwError(() => error);
      })
    );
  }
}
