import { Component, Input, Output, EventEmitter, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Order, OrderStatus } from '../../models';
import { OrderService } from '../../../services/order.service';
import { OrderDetailsDialogComponent } from '../order-details-dialog/order-details-dialog.component';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { ErrorHandlingUtilities } from '../../../services/error-handling.utilities';


@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnDestroy {
  private dialog = inject(MatDialog);
  private orderService = inject(OrderService);
  private snackBar = inject(MatSnackBar);
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);

  @Input() orders: Order[] = [];
  @Input() title?: string;
  @Input() emptyStateTitle?: string;
  @Input() emptyStateMessage?: string;
  @Input() showCatalogButton: boolean = true;
  @Input() catalogButtonText?: string;

  // Événements optionnels pour override du comportement par défaut
  @Output() orderDetails = new EventEmitter<string>();
  @Output() reorderItems = new EventEmitter<{ orderId: string, event: Event }>();
  @Output() cancelOrder = new EventEmitter<{ orderId: string, event: Event }>();

  private destroy$ = new Subject<void>();
    /* unsubscribe from all observables */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getOrderStatusColor(status: OrderStatus): string {
    const colors: Record<string, string> = {
      pending: 'warn',
      processing: 'accent',
      shipped: 'primary',
      delivered: 'primary',
      confirmed: 'primary',
      cancelled: 'warn',
      ready_for_pickup: 'accent'
    };

    return colors[String(status).toLowerCase()] || 'primary';
  }

  getOrderStatusTitle(status: OrderStatus): string {
    const titles: Record<string, string> = {
      pending: 'En attente',
      processing: 'En cours de traitement',
      shipped: 'Expédié',
      delivered: 'Livré',
      confirmed: 'Confirmé',
      cancelled: 'Annulé',
      ready_for_pickup: 'Prêt pour le retrait'
    };

    return titles[String(status).toLowerCase()] || 'Inconnu';
  }

  getOrderStatusIcon(status: OrderStatus): string {
    const icons: Record<string, string> = {
      pending: 'schedule',
      processing: 'autorenew',
      shipped: 'local_shipping',
      delivered: 'done_all',
      confirmed: 'check_circle',
      cancelled: 'cancel',
      ready_for_pickup: 'store_mall_directory'
    };

    return icons[String(status).toLowerCase()] || 'help';
  }

  onOrderDetails(orderId: string) {
    // Si un handler externe est fourni, l'utiliser, sinon utiliser le comportement par défaut
    if (this.orderDetails.observed) {
      this.orderDetails.emit(orderId);
    } else {
      this.openOrderDetailsDialog(orderId);
    }
  }

  onReorderItems(orderId: string, event: Event) {
    // Si un handler externe est fourni, l'utiliser, sinon utiliser le comportement par défaut
    if (this.reorderItems.observed) {
      this.reorderItems.emit({ orderId, event });
    } else {
      this.handleReorder(orderId, event);
    }
  }

  onCancelOrder(orderId: string, event: Event) {
    // Si un handler externe est fourni, l'utiliser, sinon utiliser le comportement par défaut
    if (this.cancelOrder.observed) {
      this.cancelOrder.emit({ orderId, event });
    } else {
      this.handleCancel(orderId, event);
    }
  }

  // Méthodes par défaut pour gérer les actions
  private openOrderDetailsDialog(orderId: string) {
    const dialogRef = this.dialog.open(OrderDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { orderId },
      panelClass: 'order-details-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'reorder') {
        // Optionnel: recharger les commandes ou notifier le parent
      }
    });
  }

  private handleReorder(orderId: string, event: Event) {
    event.stopPropagation();
    
    this.orderService.reorderItems(orderId)
    .pipe(takeUntil(this.destroy$))
    .subscribe();
  }

  private handleCancel(orderId: string, event: Event) {
    event.stopPropagation();
    
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      this.errorHandlingUtilities.wrapOperation(
        this.orderService.cancelOrder(orderId),
        'annulation de commande'
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          if (order) {
            this.snackBar.open('Commande annulée avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            // Mettre à jour la commande dans la liste locale
            const orderToUpdate = this.orders.find(o => o.id === orderId);
            if (orderToUpdate) {
              orderToUpdate.status = OrderStatus.CANCELLED; // Mise à jour de l'état de la commande trouvée
            }
          } else {
            this.snackBar.open('Impossible d\'annuler cette commande', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        }
      });
    }
  }
}
