import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingUtilities {

  constructor(private notificationService: NotificationService) {}

  /**
   * Gestionnaire d'erreur générique pour les opérations CRUD
   */
  handleError<T>(
    operation: string,
    defaultValue?: T,
    showNotification: boolean = true
  ) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      if (showNotification) {
        this.notificationService.showError(`Erreur lors de ${operation}`
        );
      }

      // Retourne une valeur par défaut ou propage l'erreur
      return defaultValue !== undefined ? of(defaultValue) : throwError(() => error);
    };
  }

  /**
   * Wrapper pour les opérations avec gestion automatique des erreurs
   */
  wrapOperation<T>(
    operation: Observable<T>,
    operationName: string,
    successMessage?: string,
    defaultValue?: T
  ): Observable<T> {
    return operation.pipe(
      map(result => {
        if (successMessage) {
          this.notificationService.showSuccess(successMessage);
        }
        return result;
      }),
      catchError(this.handleError<T>(operationName, defaultValue))
    );
  }
}
