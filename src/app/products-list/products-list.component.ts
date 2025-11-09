import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { ProductWithCategoryDto, ProductFilterOptions, ProductWithCategoryListResponse, Category } from '../shared/models';
import { ProductService } from '../services/product.service';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { FormatUtilities } from '../services/format.utilities';
import { NavigationUtilities } from '../services/navigation.utilities';
import { NotificationService } from '../services/notification.service';
import { PathNames } from '../constant/path-names.enum';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatSlideToggleModule
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private productService = inject(ProductService);
  private categoriesService = inject(CategoryService);
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);
  private navigationUtilities = inject(NavigationUtilities);
  private formatUtilities = inject(FormatUtilities);
  private notificationService = inject(NotificationService);

  // État du composant
  loading = false;
  totalProducts = 0;
  categories: Category[] = [];
  
  // Contrôles de formulaire
  searchControl = new FormControl('');
  categoryFilter = new FormControl('all');
  statusFilter = new FormControl('all');
  promotionFilter = new FormControl('all');
  stockFilter = new FormControl('all');
  minPriceControl = new FormControl<number | null>(null);
  maxPriceControl = new FormControl<number | null>(null);
  
  // Options de filtre
  statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ];
  
  promotionOptions = [
    { value: 'all', label: 'Tous les produits' },
    { value: 'promotion', label: 'En promotion' },
    { value: 'no-promotion', label: 'Sans promotion' }
  ];

  stockOptions = [
    { value: 'all', label: 'Tous les stocks' },
    { value: 'in-stock', label: 'En stock' },
    { value: 'low-stock', label: 'Stock faible' },
    { value: 'out-of-stock', label: 'Rupture de stock' }
  ];

  // Table
  displayedColumns: string[] = [
    'name',
    'sku',
    'category',
    'sellingPrice',
    'purchasePrice',
    'stockQuantity',
    'isOnPromotion',
    'isActive',
    'actions'
  ];

  dataSource = new MatTableDataSource<ProductWithCategoryDto>([]);

  // Pagination
  currentPage = 0;
  currentPageSize = 50;

  // Gestion des abonnements
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.setupFilters();
    this.loadCategories();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilters(): void {
    // Recherche avec debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });

    // Autres filtres
    [this.categoryFilter, this.statusFilter, this.promotionFilter, this.stockFilter].forEach(control => {
      control.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.applyFilters();
      });
    });

    // Filtres de prix
    [this.minPriceControl, this.maxPriceControl].forEach(control => {
      control.valueChanges.pipe(
        debounceTime(800),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.applyFilters();
      });
    });
  }

  private loadCategories(): void {
     this.errorHandlingUtilities.wrapOperation(
    this.categoriesService.getAllCategories(),
      'chargement des catégories')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories.filter(cat => cat.isActive);
        }
      });
  }

  private loadProducts(): void {
    this.loading = true;
    
    const filters = this.buildFilters();
    const page = this.currentPage;
    const size = this.currentPageSize;

    this.errorHandlingUtilities.wrapOperation(
      this.productService.getProductsWithCategory(page, size, filters),
      'chargement des produits'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.dataSource.data = response.content;
        this.totalProducts = response.totalElements;
        this.loading = false;
      }
    });
  }

  private buildFilters(): ProductFilterOptions {
    const filters: ProductFilterOptions = {};

    const search = this.searchControl.value;
    if (search) {
      filters.search = search;
    }

    const category = this.categoryFilter.value;
    if (category && category !== 'all') {
      filters.categoryId = category;
    }

    const status = this.statusFilter.value;
    if (status === 'active') {
      filters.isActive = true;
    } else if (status === 'inactive') {
      filters.isActive = false;
    }

    const promotion = this.promotionFilter.value;
    if (promotion === 'promotion') {
      filters.isOnPromotion = true;
    } else if (promotion === 'no-promotion') {
      filters.isOnPromotion = false;
    }

    const stock = this.stockFilter.value;
    if (stock === 'low-stock') {
      filters.isLowStock = true;
    }
    else if (stock === 'in-stock') {
      filters.isInStock = true;
    }
    else if (stock === 'out-of-stock') {
      filters.isOutOfStock = true;
    }

    // Filtres de prix
    const minPrice = this.minPriceControl.value;
    const maxPrice = this.maxPriceControl.value;
    
    if (minPrice !== null && minPrice >= 0) {
      filters.minPrice = minPrice;
    }

    if (maxPrice !== null && maxPrice >= 0) {
      filters.maxPrice = maxPrice;
    }

    return filters;
  }

  private applyFilters(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.currentPageSize = event.pageSize;
    
    if (this.paginator) {
      this.paginator.pageSize = event.pageSize;
      this.paginator.pageIndex = event.pageIndex;
    }
    
    this.loadProducts();
  }

  onCreateProduct(): void {
    this.navigationUtilities.goToCreateProduct();
  }

  onEditProduct(product: ProductWithCategoryDto): void {
    this.navigationUtilities.goToEditProduct(product.id!.toString());
  }

  onRowClick(product: ProductWithCategoryDto): void {
    this.onEditProduct(product);
  }

  onViewProduct(product: ProductWithCategoryDto): void {
     this.onEditProduct(product);
  }

  onToggleStatus(product: ProductWithCategoryDto): void {
    const newStatus = !product.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    this.errorHandlingUtilities.wrapOperation(
      this.productService.toggleProductStatus(product.id!.toString(), action),
      `changement de statut du produit`,
      `Produit ${action} avec succès`
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        product.isActive = newStatus;
      }
    });
  }

  onDeleteProduct(product: ProductWithCategoryDto): void {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`;
    
    if (confirm(confirmMessage)) {
      this.errorHandlingUtilities.wrapOperation(
        this.productService.deleteProduct(product.id!.toString()),
        'suppression du produit',
        'Produit supprimé avec succès'
      ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadProducts();
        }
      });
    }
  }

  onUpdateStock(product: ProductWithCategoryDto): void {
    const newStock = prompt('Nouvelle quantité en stock:', product.stockQuantity.toString());
    if (newStock !== null) {
      const stockQuantity = parseInt(newStock, 10);
      if (!isNaN(stockQuantity) && stockQuantity >= 0) {
        this.errorHandlingUtilities.wrapOperation(
          this.productService.updateProductStock(product.id!.toString(), stockQuantity),
          'mise à jour du stock',
          'Stock mis à jour avec succès'
        ).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            product.stockQuantity = stockQuantity; // Mise à jour locale
          }
        });
      } else {
        this.notificationService.showError('Quantité invalide');
      }
    }
  }

  onExportProducts(): void {
    // TODO: Implémenter l'export
    this.notificationService.showInfo('Fonctionnalité d\'export à venir');
  }

  onRefreshProducts(): void {
    this.loadProducts();
  }

  onClearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.categoryFilter.setValue('all', { emitEvent: false });
    this.statusFilter.setValue('all', { emitEvent: false });
    this.promotionFilter.setValue('all', { emitEvent: false });
    this.stockFilter.setValue('all', { emitEvent: false });
    this.minPriceControl.setValue(null, { emitEvent: false });
    this.maxPriceControl.setValue(null, { emitEvent: false });
    this.applyFilters();
  }

  // Méthodes utilitaires pour l'affichage
  formatCurrency(price: number): string {
    return this.formatUtilities.formatCurrency(price);
  }

  formatDate(date: Date | undefined): string {
    return date ? this.formatUtilities.formatDate(date) : '-';
  }

  getStatusChipColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Actif' : 'Inactif';
  }

  getStockStatusColor(product: ProductWithCategoryDto): string {
    if (product.stockQuantity === 0) return 'warn';
    if (product.stockQuantity <= product.minStock) return 'accent';
    return 'primary';
  }

  getStockStatusText(product: ProductWithCategoryDto): string {
    if (product.stockQuantity === 0) return 'Rupture';
    if (product.stockQuantity <= product.minStock) return 'Stock faible';
    return 'En stock';
  }

  getCategoryName(product: ProductWithCategoryDto): string {
    return product.category ? product.category.name : 'Sans catégorie';
  }

  calculatePriceTTC(priceHT: number, taxRate: number): number {
    return priceHT * (1 + taxRate);
  }

  isPromotionValid(product: ProductWithCategoryDto): boolean {
    if (!product.isOnPromotion || !product.promotionEndDate) return false;
    return new Date(product.promotionEndDate) > new Date();
  }

  goToDashboard(): void {
    this.navigationUtilities.goToRouteWithState(PathNames.dashboard);
  }

  // Méthodes utilitaires pour les filtres de prix
  onPriceFilterChange(): void {
    const minPrice = this.minPriceControl.value;
    const maxPrice = this.maxPriceControl.value;
    
    // Si les deux valeurs sont définies et que min > max, afficher un message d'avertissement
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      this.notificationService.showWarning('Le prix minimum ne peut pas être supérieur au prix maximum. Les valeurs seront automatiquement ajustées.');
    }
  }
}