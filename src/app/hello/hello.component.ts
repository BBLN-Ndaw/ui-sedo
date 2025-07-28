import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-hello',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatChipsModule
  ],
  templateUrl: './hello.component.html',
  styleUrl: './hello.component.scss'
})
export class HelloComponent implements OnInit {
  token: string | null = null;
  currentTime: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.authService.getToken();
    this.updateTime();
    
    // Mettre à jour l'heure toutes les secondes
    setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  private updateTime(): void {
    this.currentTime = new Date().toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Méthode pour faire un appel API avec le token dans les headers
  makeApiCall(): void {
    // Exemple d'utilisation du service avec headers d'authentification
    const headers = this.authService.getAuthHeaders();
    console.log('Headers d\'authentification:', headers);
    
    // Ici vous pourriez faire un appel HTTP avec ces headers
    // this.http.get('http://localhost:8080/api/protected', { headers }).subscribe(...)
  }
}
