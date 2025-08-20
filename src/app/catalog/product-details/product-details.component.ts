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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services et Modèles
import { CatalogService } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { ProductWithCategoryDto } from '../../shared/models';
import { PathNames } from '../../constant/path-names.enum';
import { ProductService } from '../../services/product.service';

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

    private snackBar = inject(MatSnackBar);

  
  // Sujet pour gérer la désinscription des observables
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    public productService: ProductService
  ) {
    this.product = this.router.getCurrentNavigation()?.extras?.state?.['currentProduct'];
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  

  goBack(): void {
    this.router.navigate([PathNames.catalog]);
  }

  onProductSelect(product: ProductWithCategoryDto): void {
    this.productService.orderProduct(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  getStockStatusText(product: ProductWithCategoryDto): string {
    return this.productService.getStockStatusText(product);
  }

  getStockStatusIcon(product: ProductWithCategoryDto): string {
    return this.productService.getStockStatusIcon(product);
  }

  formatCurrency(price: number): string {
    return this.productService.formatCurrency(price);
  }

  isPromotional(product: ProductWithCategoryDto): boolean {
    return (product.promotionPrice ?? 0) > 0 && 
           product.promotionEndDate != null && 
           new Date(product.promotionEndDate) > new Date();
  }

  getPromotionalPrice(product: ProductWithCategoryDto): string {
    return this.formatCurrency(product.promotionPrice ?? 0);
  }

  getDiscountPercentage(product: ProductWithCategoryDto): number {
    if (!this.isPromotional(product) || !product.promotionPrice) return 0;
    return Math.round((1 - product.promotionPrice / product.sellingPrice) * 100);
  }

  isPromotionExpiringSoon(product: ProductWithCategoryDto): boolean {
    if (!product.promotionEndDate) return false;
    const now = new Date();
    const endDate = new Date(product.promotionEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
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
      console.log('Ajout/suppression des favoris pour le produit:', this.product.name);
      // TODO: Implémenter la logique des favoris
    }
  }
}
