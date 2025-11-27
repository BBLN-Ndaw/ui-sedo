import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Services et Modèles
import { ProductWithCategoryDto } from '../shared/models';
import { PathNames } from '../constant/path-names.enum';
import { ProductService } from '../services/product.service';
import { FavoritesService } from '../services/favorites.service';
import { PromotionUtilities } from '../services/promotion.utilities';
import { StockUtilities } from '../services/stock.utilities';
import { FormatUtilities } from '../services/format.utilities';
import { NavigationUtilities } from '../services/navigation.utilities';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  product: ProductWithCategoryDto | null = null;
  isLoading = false;
  currentImageIndex = 0;
  
  // Nouvelles propriétés pour les améliorations
  isImageZoomed = false;
  showZoomHint = false;
  selectedQuantity = 1;
  isFavorite = false;
  productId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private router: Router,
     private productService: ProductService,
     private favoritesService: FavoritesService,
    private promotionUtilities: PromotionUtilities,
    private stockUtilities: StockUtilities,
    private formatUtilities: FormatUtilities,
    private navigationUtilities: NavigationUtilities,
    private route: ActivatedRoute,
    private errorHandlingUtilities: ErrorHandlingUtilities) {
          this.productId = this.route.snapshot.paramMap.get('id')!;
     }

  ngOnInit(): void {
    if (this.productId) {
      this.isFavorite = this.favoritesService.isFavorite(Number(this.productId));

      this.loadProductDetails(this.productId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  

  goBack(): void {
    this.navigationUtilities.goToCatalog();
  }

  loadProductDetails(productId: string): void {
    this.isLoading = true;
    this.errorHandlingUtilities.wrapOperation(
      this.productService.getProductWithCategoryById(productId),
      'chargement des détails du produit'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe((product) => {
      this.product = product;
      this.isLoading = false;
    });

  }

  onProductSelect(product: ProductWithCategoryDto): void {
    this.errorHandlingUtilities.wrapOperation(
      this.productService.orderProduct(product),
      'ajout au panier',
      'Produit ajouté au panier avec succès !'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe();
  }

  getStockStatusText(product: ProductWithCategoryDto): string {
    return this.stockUtilities.getStockStatusText(product);
  }

  getStockStatusIcon(product: ProductWithCategoryDto): string {
    return this.stockUtilities.getStockStatusIcon(product);
  }

  getStockStatus(product: ProductWithCategoryDto): string {
    return this.stockUtilities.getStockStatus(product);
  }

  formatCurrency(price: number): string {
    return this.formatUtilities.formatCurrency(price);
  }

  /**
   * Formate le prix TTC d'un produit
   */
  formatProductPriceTTC(product: ProductWithCategoryDto): string {
    return this.promotionUtilities.formatApplicablePriceTTC(product);
  }

  /**
   * Obtient le prix TTC promotionnel d'un produit
   */
  getPromotionalPriceTTC(product: ProductWithCategoryDto): string {
    return this.promotionUtilities.getPromotionalPriceTTC(product);
  }

  /**
   * Obtient le prix TTC normal (pour affichage barré dans les promotions)
   */
  getNormalPriceTTC(product: ProductWithCategoryDto): string {
    return this.promotionUtilities.getNormalPriceTTC(product);
  }

  isPromotional(product: ProductWithCategoryDto): boolean {
    return this.promotionUtilities.isValidPromotion(product);
  }

  getPromotionalPrice(product: ProductWithCategoryDto): string {
    return this.getPromotionalPriceTTC(product);
  }

  getDiscountPercentage(product: ProductWithCategoryDto): number {
    return this.promotionUtilities.getDiscountPercentage(product);
  }

  /**
   * Calcule le montant d'économies en TTC
   */
  getSavingsAmountTTC(product: ProductWithCategoryDto): string {
    return this.promotionUtilities.getSavingsAmountTTC(product);
  }

  isPromotionExpiringSoon(product: ProductWithCategoryDto): boolean {
    return this.promotionUtilities.isPromotionExpiringSoon(product);
  }

  nextImage(): void {
    if (this.product && this.product.imageUrls.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.product.imageUrls.length;
    }
  }

  previousImage(): void {
    if (this.product && this.product.imageUrls.length > 1) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.product.imageUrls.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  toggleWishlist(): void {
    if (this.product) {
      if (this.isFavorite) {
        this.favoritesService.removeFromFavorites(this.product.id);
        this.isFavorite = false;
      } else {
        const priceTTC = this.promotionUtilities.getApplicablePriceTTC(this.product);
        this.favoritesService.addToFavorites({
          productId: this.product.id,
          name: this.product.name,
          imageUrl: this.product.imageUrls[0],
          price: priceTTC,
          availability: this.stockUtilities.getStockStatus(this.product)
        });
        this.isFavorite = true;
      }
    }
  }
  
  // === Nouvelles méthodes d'amélioration ===
  
  // Navigation vers catégorie
  navigateToCategory(categoryId: string | number): void {
    this.router.navigate([PathNames.catalog], {
      queryParams: { category: categoryId }
    });
  }
  
  // Tronquer le texte
  truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  // Vérifications de statut produit
  isNewProduct(product: ProductWithCategoryDto): boolean {
    // Considérer un produit comme nouveau s'il a été créé dans les 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Si le produit a une date de création, la comparer
    if ((product as any).createdDate) {
      return new Date((product as any).createdDate) > thirtyDaysAgo;
    }
    
    // Sinon, utiliser l'ID (produits récents ont des IDs plus élevés)
    return product.id > 100; // Exemple de logique
  }
  
  isBestseller(product: ProductWithCategoryDto): boolean {
    // Logique pour déterminer si c'est un bestseller
    // Peut être basé sur les ventes, les avis, etc.
    return product.id % 5 === 0; // Exemple simplifié
  }
  
  // Gestion du zoom d'image
  toggleImageZoom(): void {
    this.isImageZoomed = !this.isImageZoomed;
    if (this.isImageZoomed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  
  closeImageZoom(event: Event): void {
    event.stopPropagation();
    this.isImageZoomed = false;
    document.body.style.overflow = '';
  }
  
  // Gestion de la quantité
  increaseQuantity(): void {
    if (this.product && this.selectedQuantity < this.product.stockQuantity) {
      this.selectedQuantity++;
    }
  }
  
  decreaseQuantity(): void {
    if (this.selectedQuantity > 1) {
      this.selectedQuantity--;
    }
  }
  
  // Méthodes de prix avancées
  formatProductPriceHT(product: ProductWithCategoryDto): string {
    const priceHT = product.sellingPrice / 1.2; // Enlever la TVA de 20%
    return this.formatUtilities.formatCurrency(priceHT);
  }
  
  getTaxAmount(product: ProductWithCategoryDto): string {
    const taxAmount = product.sellingPrice - (product.sellingPrice / 1.2);
    return this.formatUtilities.formatCurrency(taxAmount);
  }
  
  getPromotionEndDate(product: ProductWithCategoryDto): Date | null {
    // Retourner une date de fin de promotion si disponible
    // Pour l'exemple, retourner une date dans 7 jours
    if (this.isPromotional(product)) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      return endDate;
    }
    return null;
  }
  
  formatDate(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Achat express
  buyNow(product: ProductWithCategoryDto): void {
    // Ajouter au panier et rediriger vers le paiement
    this.onProductSelect(product);
    // Redirection vers le panier/checkout
    setTimeout(() => {
      this.router.navigate([PathNames.cart]);
    }, 500);
  }
}
