import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {
  private tokenCheckInterval: Subscription | null = null;
  private readonly CHECK_INTERVAL = 60000; // Vérifier toutes les minutes

  constructor(private authService: AuthService) {}

  startTokenValidation(): void {
    // Arrêter toute vérification précédente
    this.stopTokenValidation();

    // Démarrer la vérification périodique
    this.tokenCheckInterval = interval(this.CHECK_INTERVAL).subscribe(() => {
      this.checkTokenValidity();
    });

    // Vérification immédiate
    this.checkTokenValidity();
  }

  stopTokenValidation(): void {
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
      this.tokenCheckInterval = null;
    }
  }

  private checkTokenValidity(): void {
    if (!this.authService.isAuthenticated()) {
      console.log('Token expiré détecté lors de la vérification périodique');
      this.stopTokenValidation();
    }
  }

  // Vérifier avec le serveur
  verifyTokenWithServer(): void {
    this.authService.validateTokenWithServer().subscribe({
      next: (isValid) => {
        if (!isValid) {
          this.stopTokenValidation();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la validation du token:', error);
        this.stopTokenValidation();
      }
    });
  }
}
