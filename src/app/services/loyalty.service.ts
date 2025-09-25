import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoyaltyProgram {
  level: string;
  points: number;
  nextLevelPoints: number;
  benefits: string[];
  progress: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private http = inject(HttpClient);
  private apiUrl = `http://localhost:8080/api/loyalty`;

  /**
   * Récupère le programme de fidélité de l'utilisateur connecté
   */
  getMyLoyaltyProgram(): Observable<LoyaltyProgram> {
    return this.http.get<LoyaltyProgram>(`${this.apiUrl}/my-program`, {
      withCredentials: true
    });
  }

  /**
   * Récupère le programme de fidélité d'un utilisateur spécifique (admin seulement)
   */
  getUserLoyaltyProgram(customerUserName: string): Observable<LoyaltyProgram> {
    return this.http.get<LoyaltyProgram>(`${this.apiUrl}/${customerUserName}`, {
      withCredentials: true
    });
  }
}
