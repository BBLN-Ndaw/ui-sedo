import { Injectable } from "@angular/core";
import { takeUntil } from "rxjs";
import { ProductWithCategoryDto } from "../shared/models";
import { CartService } from "../services/cart.service";
import { NotificationService } from "../services/notification.service";

@Injectable({
  providedIn: 'root'
})
export class ProductUtilities {
  constructor(private readonly cartService: CartService,
     private readonly notificationService: NotificationService) { }

    handleaddingToCart(product: ProductWithCategoryDto): void {
    try {
      if (this.getStockStatus(product) === 'out-of-stock') {
        this.notificationService.showWarning('Ce produit n\'est plus disponible en stock');
        return;
      }

      // Vérifier si le produit est déjà dans le panier
      const currentQuantityInCart = this.cartService.getProductQuantityInCart(product.id);
      if (currentQuantityInCart >= product.stockQuantity) {
        this.notificationService.showWarning('Quantité maximale déjà atteinte pour ce produit');
        return;
      }

      // Ajouter au panier
      this.cartService.addToCart(product, 1)
        .subscribe({
          next: (cart) => {
            const totalQuantity = this.cartService.getProductQuantityInCart(product.id);
            this.notificationService.showSuccess(
              `${product.name} ajouté au panier (${totalQuantity})`
            );
            console.log('Produit ajouté au panier:', { product, cart });
          },
          error: (error) => {
            console.error('Erreur lors de l\'ajout au panier:', error);
            this.notificationService.showError(error.message || 'Erreur lors de l\'ajout au panier');
          }
        });
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      this.notificationService.showError(error.message || 'Erreur lors de l\'ajout au panier');
    }
  }

  getStockStatus(product: ProductWithCategoryDto): 'in-stock' | 'low-stock' | 'out-of-stock' {
    if (product.stockQuantity === 0) return 'out-of-stock';
    if (product.stockQuantity <= 5) return 'low-stock';
    return 'in-stock';
  }

  getStockStatusText(product: ProductWithCategoryDto): string {
    const status = this.getStockStatus(product);
    switch (status) {
      case 'out-of-stock': return 'Rupture de stock';
      case 'low-stock': return 'Stock faible';
      case 'in-stock': return 'En stock';
      default: return 'En stock';
    }
  }

  getStockStatusIcon(product: ProductWithCategoryDto): string {
    const status = this.getStockStatus(product);
    switch (status) {
      case 'out-of-stock': return 'block';
      case 'low-stock': return 'warning';
      case 'in-stock': return 'check_circle';
      default: return 'check_circle';
    }
  }

  formatCurrency(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

   
}