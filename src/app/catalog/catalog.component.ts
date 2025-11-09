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
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Services et Modèles
import { NotificationService } from '../services/notification.service';
import {Category, ProductWithCategoryDto } from '../shared/models';
import { PathNames } from '../constant/path-names.enum';
import { ProductService } from '../services/product.service';
import { CategoryService} from '../services/category.service';
import { PromotionUtilities } from '../services/promotion.utilities';
import { StockUtilities } from '../services/stock.utilities';
import { FormatUtilities } from '../services/format.utilities';
import { NavigationUtilities } from '../services/navigation.utilities';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';

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
    MatTooltipModule,
    MatSnackBarModule
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
  categories: Category[] = [];
  
  // Sujet pour gérer la désinscription des observables
  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private router: Router,
    public productService: ProductService,
    private promotionUtilities: PromotionUtilities,
    private stockUtilities: StockUtilities,
    private formatUtilities: FormatUtilities,
    private navigationUtilities: NavigationUtilities,
    private errorHandlingUtilities: ErrorHandlingUtilities
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProductsWithCategory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  private loadProductsWithCategory(): void {
    this.isLoading = true;
    this.errorHandlingUtilities.wrapOperation(
      this.productService.getAllProductWithCategory(),
      'chargement des produits'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (productWithCategory) => {
        console.log('Produits avec catégorie chargés:', productWithCategory);
        this.productWithCategorys = productWithCategory;
        this.promotionalProductWithCategorys = productWithCategory.filter(p => 
          this.promotionUtilities.isValidPromotion(p)
        );
        console.log('Produits en promotion avec catégorie chargés:', this.promotionalProductWithCategorys);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
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
   * Obtient le prix TTC normal (pour affichage barré dans les promotions)
   */
  getNormalPriceTTC(product: ProductWithCategoryDto): string {
    return this.promotionUtilities.getNormalPriceTTC(product);
  }

  getStockStatus(product: ProductWithCategoryDto): 'in-stock' | 'low-stock' | 'out-of-stock' {
    return this.stockUtilities.getStockStatus(product);
  }

  getStockStatusText(product: ProductWithCategoryDto): string {
    return this.stockUtilities.getStockStatusText(product);
  }

  getStockStatusIcon(product: ProductWithCategoryDto): string {
    return this.stockUtilities.getStockStatusIcon(product);
  }

  onProductSelect(product: ProductWithCategoryDto): void {
    this.productService.orderProduct(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  onProductView(product: ProductWithCategoryDto): void {
    console.log('Voir détails du produit:', product);
    this.navigationUtilities.goToRouteWithId(PathNames.productDetails, product.id);
  }

  trackByProductId(index: number, product: ProductWithCategoryDto): number {
    return product.id;
  }

  getInStockCount(): number {
    return this.stockUtilities.getInStockCount(this.productWithCategorys);
  }

  getPromotionalProducts(): ProductWithCategoryDto[] {
    return this.productWithCategorys.filter(product => 
      this.promotionUtilities.isValidPromotion(product)
    );
  }

  getPromotionalPrice(product: ProductWithCategoryDto): string {
    return this.promotionUtilities.getPromotionalPriceTTC(product);
  }

  getDiscountPercentage(product: ProductWithCategoryDto): number {
    return this.promotionUtilities.getDiscountPercentage(product);
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
    return this.promotionUtilities.isPromotionExpiringSoon(product);
  }
}
