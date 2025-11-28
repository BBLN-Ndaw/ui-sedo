import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface NotificationConfig {
  message: string;
  action?: string;
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly defaultDuration = 3000;

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Affiche une notification de succès
   */
  showSuccess(message: string, action?: string, duration?: number): void {
    this.show({
      message,
      action,
      duration,
      type: 'success'
    });
  }

  /**
   * Affiche une notification d'erreur
   */
  showError(message: string, action?: string, duration?: number): void {
    this.show({
      message,
      action,
      duration: duration || 9000,
      type: 'error'
    });
  }

  /**
   * Affiche une notification d'avertissement
   */
  showWarning(message: string, action?: string, duration?: number): void {
    this.show({
      message,
      action,
      duration,
      type: 'warning'
    });
  }

  /**
   * Affiche une notification d'information
   */
  showInfo(message: string, action?: string, duration?: number): void {
    this.show({
      message,
      action,
      duration,
      type: 'info'
    });
  }

  /**
   * Affiche une notification générique
   */
  private show(config: NotificationConfig): void {
    const snackBarConfig: MatSnackBarConfig = {
      duration: config.duration || this.defaultDuration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: this.getPanelClass(config.type || 'info')
    };

    this.snackBar.open(
      config.message,
      config.action || 'Fermer',
      snackBarConfig
    );
  }

  /**
   * Retourne les classes CSS selon le type de notification
   */
  private getPanelClass(type: string): string[] {
    const baseClasses = ['notification-snackbar'];
    
    switch (type) {
      case 'success':
        return [...baseClasses, 'notification-success'];
      case 'error':
        return [...baseClasses, 'notification-error'];
      case 'warning':
        return [...baseClasses, 'notification-warning'];
      case 'info':
      default:
        return [...baseClasses, 'notification-info'];
    }
  }
}
