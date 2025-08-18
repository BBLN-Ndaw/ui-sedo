import { Component, Inject, OnInit } from '@angular/core';
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

import { Order, OrderService } from '../../../services/order.service';
import { CartService } from '../../../services/cart.service';

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
export class OrderDetailsDialogComponent implements OnInit {
  order: Order | null = null;
  isLoading = true;
  isProcessing = false;

  constructor(
    public dialogRef: MatDialogRef<OrderDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orderId: string },
    private orderService: OrderService,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadOrderDetails();
  }

  loadOrderDetails() {
    this.isLoading = true;
    this.orderService.getOrderById(this.data.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des détails', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getStatusInfo() {
    if (!this.order) return null;
    const statusInfo = this.orderService.getOrderStatusInfo();
    return statusInfo[this.order.status as keyof typeof statusInfo];
  }

  onCancelOrder() {
    if (!this.order || !['pending', 'processing'].includes(this.order.status)) {
      return;
    }

    this.isProcessing = true;
    this.orderService.cancelOrder(this.order.id).subscribe({
      next: (success) => {
        this.isProcessing = false;
        if (success) {
          if (this.order) {
            this.order.status = 'cancelled';
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
      error: (error) => {
        this.isProcessing = false;
        console.error('Error cancelling order:', error);
        this.snackBar.open('Erreur lors de l\'annulation', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onReorder() {
    if (!this.order || this.order.status !== 'delivered') {
      return;
    }

    this.isProcessing = true;
    this.orderService.reorderItems(this.order.id).subscribe({
      next: (success) => {
        this.isProcessing = false;
        if (success) {
          this.snackBar.open('Articles ajoutés au panier', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close('reorder');
        } else {
          this.snackBar.open('Erreur lors de l\'ajout au panier', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('Error reordering:', error);
        this.snackBar.open('Erreur lors de la reommande', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onClose() {
    this.dialogRef.close();
  }

  canCancel(): boolean {
    return this.order !== null && ['pending', 'processing'].includes(this.order.status);
  }

  canReorder(): boolean {
    return this.order !== null && this.order.status === 'delivered';
  }
}
