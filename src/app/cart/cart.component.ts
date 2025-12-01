import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
import { FormatUtilities } from '../services/format.utilities';
import { NavigationUtilities } from '../services/navigation.utilities';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { Cart, CartItem } from '../shared/models';
import { OrderService } from '../services/order.service';

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
  
  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private router: Router,
    private formatUtilities: FormatUtilities,
    private navigationUtilities: NavigationUtilities,
    private errorHandlingUtilities: ErrorHandlingUtilities
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
    this.errorHandlingUtilities.wrapOperation(
      this.cartService.updateCartItem(item.id, item.quantity + 1),
      'mise à jour de la quantité',
      'Quantité mise à jour'
    ).pipe(takeUntil(this.destroy$)).subscribe();
  }

  /**
   * Diminue la quantité d'un article
   */
  decreaseQuantity(item: CartItem): void {
    if (item.quantity <= 1) {
      this.removeItem(item);
      return;
    }

    this.errorHandlingUtilities.wrapOperation(
      this.cartService.updateCartItem(item.id, item.quantity - 1),
      'mise à jour de la quantité',
      'Quantité mise à jour'
    ).pipe(takeUntil(this.destroy$)).subscribe();
  }

  /**
   * Supprime un article du panier
   */
  removeItem(item: CartItem): void {
    this.errorHandlingUtilities.wrapOperation(
      this.cartService.removeFromCart(item.id),
      'suppression de l\'article',
      `${item.productName} retiré du panier`
    ).pipe(takeUntil(this.destroy$)).subscribe();
  }

  /**
   * Vide complètement le panier
   */
  clearCart(): void {
    if (this.cart && this.cart.items.length > 0) {
      this.errorHandlingUtilities.wrapOperation(
        this.cartService.clearCart(),
        'vidange du panier',
        'Panier vidé'
      ).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  /**
   * Procède au paiement
   */
  onProceedToPayment(): void {
    if (this.cart && this.cart.items.length > 0) {
      this.navigationUtilities.goToPayment(this.cart);
    }
  }

  /**
   * Formate un prix en euros
   */
  formatCurrency(price: number): string {
    return this.formatUtilities.formatCurrency(price);
  }

  /**
   * Calcule et formate le prix TTC d'un item
   */
  getItemPriceTTC(item: CartItem): string {
    return this.formatCurrency(this.cartService.calculateItemPriceTTC(item));
  }

  /**
   * Calcule et formate le total TTC d'un item
   */
  getItemTotalTTC(item: CartItem): string {
    return this.formatCurrency(this.cartService.calculateItemTotalTTC(item));
  }

  /**
   * Calcule et formate le sous-total HT du panier
   */
  getCartSubTotalHT(): string {
    return this.cart ? this.formatCurrency(this.cartService.calculateCartSubTotalHT(this.cart)) : this.formatCurrency(0);
  }

  /**
   * Calcule et formate le total des taxes du panier
   */
  getCartTotalTax(): string {
    return this.cart ? this.formatCurrency(this.cartService.calculateCartTotalTax(this.cart)) : this.formatCurrency(0);
  }

  /**
   * Calcule et formate le total TTC du panier
   */
  getCartTotalTTC(): string {
    return this.cart ? this.formatCurrency(this.cartService.calculateCartTotalTTC(this.cart)) : this.formatCurrency(0);
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
