import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Services et Modèles
import { CartService } from '../services/cart.service';
import { NotificationService } from '../services/notification.service';
import { Cart, CartItem } from '../shared/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  isLoading = false;
  
  // Sujet pour gérer la désinscription des observables
  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge le panier actuel
   */
  private loadCart(): void {
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
      });
  }

  /**
   * Augmente la quantité d'un article
   */
  increaseQuantity(item: CartItem): void {
    try {
      this.cartService.updateCartItem(item.id, item.quantity + 1)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Quantité mise à jour');
          },
          error: (error) => {
            this.notificationService.showError(error.message || 'Erreur lors de la mise à jour');
          }
        });
    } catch (error: any) {
      this.notificationService.showError(error.message || 'Erreur lors de la mise à jour');
    }
  }

  /**
   * Diminue la quantité d'un article
   */
  decreaseQuantity(item: CartItem): void {
    try {
      if (item.quantity <= 1) {
        this.removeItem(item);
        return;
      }

      this.cartService.updateCartItem(item.id, item.quantity - 1)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Quantité mise à jour');
          },
          error: (error) => {
            this.notificationService.showError(error.message || 'Erreur lors de la mise à jour');
          }
        });
    } catch (error: any) {
      this.notificationService.showError(error.message || 'Erreur lors de la mise à jour');
    }
  }

  /**
   * Supprime un article du panier
   */
  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess(`${item.productName} retiré du panier`);
        },
        error: (error) => {
          this.notificationService.showError('Erreur lors de la suppression');
        }
      });
  }

  /**
   * Vide complètement le panier
   */
  clearCart(): void {
    if (this.cart && this.cart.items.length > 0) {
      this.cartService.clearCart()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Panier vidé');
          },
          error: (error) => {
            this.notificationService.showError('Erreur lors de la vidange du panier');
          }
        });
    }
  }

  /**
   * Procède au paiement
   */
  onProceedToPayment(): void {
    if (this.cart && this.cart.items.length > 0) {
      this.notificationService.showInfo('Redirection vers le paiement...');
      // TODO: Implémenter la redirection vers le paiement
    }
  }

  /**
   * Formate un prix en euros
   */
  formatCurrency(price: number): string {
    return this.cartService.formatCurrency(price);
  }

  /**
   * Vérifie si le panier est vide
   */
  get isCartEmpty(): boolean {
    return !this.cart || this.cart.items.length === 0;
  }

  /**
   * Obtient le nombre total d'articles
   */
  get totalItems(): number {
    return this.cart ? this.cart.itemCount : 0;
  }

  /**
   * TrackBy function pour optimiser les performances
   */
  trackByItemId(index: number, item: CartItem): string {
    return item.id;
  }
}
