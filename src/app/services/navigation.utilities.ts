import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PathNames } from '../constant/path-names.enum';
import { ProductWithCategoryDto, Cart, PaypalCapturedResponse } from '../shared/models';

@Injectable({
  providedIn: 'root'
})
export class NavigationUtilities {

  constructor(private router: Router) {}

  /**
   * Navigation vers le catalogue
   */
  goToCatalog(): void {
    this.router.navigate([PathNames.catalog]);
  }

  /**
   * Navigation vers les détails d'un produit
   */
  goToProductDetails(product: ProductWithCategoryDto): void {
    this.router.navigate([PathNames.productDetails], { 
      state: { currentProduct: product } 
    });
  }

  /**
   * Navigation vers le panier
   */
  goToCart(): void {
    this.router.navigate([PathNames.cart]);
  }

  /**
   * Navigation vers la page de paiement
   */
  goToPayment(cart?: Cart): void {
    const state = cart ? { currentCart: cart } : {};
    this.router.navigate(['/payment'], { state });
  }

  /**
   * Navigation vers la confirmation de paiement
   */
  goToPaymentConfirmation(data: PaypalCapturedResponse): void {
    const state =  { paymentInfo: data };
    this.router.navigate(['/payment-confirmation'], { state });
  }

  /**
   * Navigation vers le dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Navigation vers la page de connexion
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navigation vers les commandes
   */
  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  /**
   * Navigation vers le profil
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Navigation vers une route spécifique
   */
  goToRoute(route: string, state?: any): void {
    this.router.navigate([route], state ? { state } : {});
  }

  /**
   * Navigation précédente (retour)
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Recharge la page actuelle
   */
  reload(): void {
    window.location.reload();
  }
}
