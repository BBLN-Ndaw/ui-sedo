import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { OrderService } from '../services/order.service';
import { Order, OrderStatus } from '../shared/models';
import { Subject, takeUntil } from 'rxjs';
import { FormatUtilities } from '../services/format.utilities';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';

@Component({
  selector: 'app-order-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatCardModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './order-details-dialog.component.html',
  styleUrls: ['./order-details-dialog.component.scss']
})
export class OrderDetailsDialogComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  isLoading = true;
  isProcessing = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<OrderDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orderId: string },
    private orderService: OrderService,
    private snackBar: MatSnackBar,
    private formatUtilities: FormatUtilities,
    private errorHandlingUtilities: ErrorHandlingUtilities
  ) {}

  ngOnInit() {
    this.loadOrderDetails();
  }

  /* unsubscribe from all observables */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrderDetails() {
    this.isLoading = true;
    this.errorHandlingUtilities.wrapOperation(
      this.orderService.getOrderById(this.data.orderId),
      'chargement des détails de commande'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (order) => {
        this.order = order;
        console.log('Order details loaded:', this.order);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getStatusInfo() {
    if (!this.order) return null;
    const statusInfo = this.orderService.getOrderStatusInfo();
    return statusInfo[this.order.status as keyof typeof statusInfo];
  }

  onCancelOrder() {
    if (!this.order || ![OrderStatus.PENDING, OrderStatus.PROCESSING].includes(this.order.status)) {
      return;
    }

    this.isProcessing = true;
    const orderId = this.order.id;
    if (!orderId) {
      this.isProcessing = false;
      this.snackBar.open('Impossible d\'annuler cette commande', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
      });
      return;
    }
    
    this.errorHandlingUtilities.wrapOperation(
      this.orderService.cancelOrder(orderId),
      'annulation de commande'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (order) => {
        this.isProcessing = false;
        if (order) {
          if (this.order) {
            this.order.status = OrderStatus.CANCELLED; // Mise à jour de l'état de la commande courante
          }
          this.snackBar.open('Commande annulée avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.snackBar.open('Impossible d\'annuler cette commande', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: () => {
        this.isProcessing = false;
      }
    });
  }

  onReorder() {
    if (!this.canReorder()) {
      return;
    }

    this.isProcessing = true;
    this.errorHandlingUtilities.wrapOperation(
      this.orderService.reorderItems(this.order?.id!),
      'renouvellement de commande',
      'Articles ajoutés au panier avec succès !'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.isProcessing = false;
      },
      error: () => {
        this.isProcessing = false;
      }
    });
  }

  onClose() {
    this.dialogRef.close();
  }

  /**
   * Calcule le prix unitaire TTC d'un item de commande
   */
  getItemUnitPriceTTC(item: any): number {
    return item.productUnitPrice * (1 + item.productTaxRate);
  }

  /**
   * Calcule le prix total TTC d'un item de commande
   */
  getItemTotalPriceTTC(item: any): number {
    return this.getItemUnitPriceTTC(item) * item.quantity;
  }

  /**
   * Formate un prix pour l'affichage
   */
  formatPrice(price: number): string {
    return this.formatUtilities.formatCurrency(price);
  }

  canCancel(): boolean {
    return this.order !== null && [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(this.order.status);
  }

  canReorder(): boolean {
    return this.order !== null && (this.order.status === OrderStatus.DELIVERED || this.order.status === OrderStatus.READY_FOR_PICKUP);
  }
}
