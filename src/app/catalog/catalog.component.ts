import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services et Modèles
import { CatalogService } from '../services/catalog.service';
import { Product, ProductCategory, ProductWithCategoryDto } from '../shared/models';
import { PathNames } from '../constant/path-names.enum';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatRippleModule,
    MatTooltipModule
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit, OnDestroy {
  @ViewChild('promoContainer', { static: false }) promoContainer!: ElementRef<HTMLElement>;

  // État du composant
  isLoading = false;
  productWithCategorys: ProductWithCategoryDto[] = [];
  promotionalProductWithCategorys: ProductWithCategoryDto[] = [];
  categories: ProductCategory[] = [];

  constructor(
    private catalogService: CatalogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProductsWithCategory();
  }

  ngOnDestroy(): void {
  }

  private loadCategories(): void {
    this.catalogService.getCategories()
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  private loadProductsWithCategory(): void {
    this.isLoading = true;
    this.catalogService.getProductWithCategory().subscribe({
      next: (productWithCategory) => {
        console.log('Produits avec catégorie chargés:', productWithCategory);
        this.productWithCategorys = productWithCategory;
        this.promotionalProductWithCategorys = productWithCategory.filter(p => p.isOnPromotion);
        console.log('Produits avec catégorie chargés:', this.promotionalProductWithCategorys);
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Erreur lors du chargement du produit avec catégorie:', error);
      }
    });
  }

  formatCurrency(price: number): string {
    return this.catalogService.formatCurrency(price);
  }

  getStockStatus(product: ProductWithCategoryDto): 'in-stock' | 'low-stock' | 'out-of-stock' {
    if (product.stockQuantity === 0) return 'out-of-stock';
    if (product.stockQuantity <= product.minStock) return 'low-stock';
    return 'in-stock';
  }

  getStockStatusText(product: ProductWithCategoryDto): string {
    const status = this.getStockStatus(product);
    switch (status) {
      case 'in-stock': return 'En stock';
      case 'low-stock': return 'Stock faible';
      case 'out-of-stock': return 'Rupture de stock';
    }
  }

  getStockStatusIcon(product: ProductWithCategoryDto): string {
    const status = this.getStockStatus(product);
    switch (status) {
      case 'in-stock': return 'check_circle';
      case 'low-stock': return 'warning';
      case 'out-of-stock': return 'error';
    }
  }

  onProductSelect(product: ProductWithCategoryDto): void {
    console.log('Produit sélectionné:', product);
    // TODO: Implémenter l'ajout au panier
  }

  onProductView(product: ProductWithCategoryDto): void {
    console.log('Voir détails du produit:', product);
    this.router.navigate([PathNames.productDetails], { state: { currentProduct: product } });
  }

  trackByProductId(index: number, product: ProductWithCategoryDto): number {
    return product.id;
  }

  getInStockCount(): number {
    return this.productWithCategorys.filter(product => this.getStockStatus(product) === 'in-stock').length;
  }

  getPromotionalProducts(): ProductWithCategoryDto[] {
    return this.productWithCategorys.filter(product => product.isOnPromotion);
  }

  getPromotionalPrice(product: ProductWithCategoryDto): string {
    return this.catalogService.formatCurrency(product.promotionPrice || product.sellingPrice);
  }

  getDiscountPercentage(product: ProductWithCategoryDto): number {
    if (!product.promotionPrice) return 0;
    return Math.round((1 - product.promotionPrice / product.sellingPrice) * 100);
  }

  scrollPromos(direction: 'left' | 'right'): void {
    const container = this.promoContainer.nativeElement;
    const scrollAmount = 300;
    const currentScroll = container.scrollLeft;
    const targetScroll = direction === 'left'
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }

  isPromotionExpiringSoon(product: ProductWithCategoryDto): boolean {
    if (!product.promotionEndDate) return false;
    const now = new Date();
    const endDate = new Date(product.promotionEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  }
}
