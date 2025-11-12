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

import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { Category, Supplier, SupplierFilterOptions } from '../shared/models';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { FormatUtilities } from '../services/format.utilities';
import { SupplierService } from '../services/supplier.service';
import { NavigationUtilities } from '../services/navigation.utilities';
import { PathNames } from '../constant/path-names.enum';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-suppliers-list',
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
    MatDividerModule
  ],
  templateUrl: './suppliers-list.component.html',
  styleUrls: ['./suppliers-list.component.scss']
})
export class SuppliersListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private supplierService = inject(SupplierService);
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);
  private navigationUtilities = inject(NavigationUtilities);
  private formatUtilities = inject(FormatUtilities);
  private categoriesService = inject(CategoryService);

  // État du composant
  loading = false;
  totalSuppliers = 0;
  categories: Category[] = [];
  
  // Contrôles de formulaire
  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  categoryFilter = new FormControl('all');
  
  // Options de filtre
  statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ];

  // Table
  displayedColumns: string[] = [
    'name',
    'contactPerson',
    'email',
    'phone',
    'category',
    'isActive',
    'actions'
  ];

  dataSource = new MatTableDataSource<Supplier>([]);

  // Pagination
  currentPage = 0;
  currentPageSize = 20;

  // Gestion des abonnements
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.setupFilters();
    this.loadCategories();
    this.loadSuppliers();
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

    // Filtres de statut, catégorie et produits
    this.statusFilter.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });

    this.categoryFilter.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
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

  private loadSuppliers(): void {
    this.loading = true;
    
    const filters = this.buildFilters();
    const page = this.currentPage;
    const size = this.currentPageSize;

    this.errorHandlingUtilities.wrapOperation(
      this.supplierService.getSuppliers(page, size, filters),
      'chargement des fournisseurs',
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.dataSource.data = response.content;
        this.totalSuppliers = response.totalElements;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fournisseurs:', error);
        this.loading = false;
      }
    });
  }

  private buildFilters(): SupplierFilterOptions {
    const filters: SupplierFilterOptions = {};

    const search = this.searchControl.value;
    if (search) {
      filters.search = search;
    }

    const status = this.statusFilter.value;
    if (status === 'active') {
      filters.isActive = true;
    } else if (status === 'inactive') {
      filters.isActive = false;
    }

    const category = this.categoryFilter.value;
    if (category && category !== 'all') {
      filters.category = category;
    }

    return filters;
  }

  private applyFilters(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadSuppliers();
  }

  getCategoryName(categoryId: string): string {
    if (!categoryId) return 'Non défini';
    const category = this.categories.find(cat => String(cat.id) === categoryId);
    return category ? category.name : 'Inconnu';
  }

  onViewSupplierDetails(supplier: Supplier): void {
    this.navigationUtilities.goToRouteWithId(PathNames.supplierDetails, supplier.id!!);
  }
 
  onUpdateStatus(supplier: Supplier): void {
    const newStatus = !supplier.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    this.errorHandlingUtilities.wrapOperation(
      this.supplierService.updateSupplierStatus(supplier.id!, action),
      'Mise à jour du statut du fournisseur'
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
        next: () => {
          this.loadSuppliers();
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.currentPageSize = event.pageSize;
    
    if (this.paginator) {
      this.paginator.pageSize = event.pageSize;
      this.paginator.pageIndex = event.pageIndex;
    }
    
    this.loadSuppliers();
  }

  getContactPersonName(supplier: Supplier): string {
    return supplier.contactPersonName || 'Non défini';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Aucune';
    return this.formatUtilities.formatDate(date);
  }

  getStatusChipColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Actif' : 'Inactif';
  }

  onExportSuppliers(): void {
    // TODO: Implémenter l'export des fournisseurs
    console.log('Export des fournisseurs à implémenter');
  }

  onRefreshSuppliers(): void {
    this.loadSuppliers();
  }

  onClearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusFilter.setValue('all', { emitEvent: false });
    this.categoryFilter.setValue('all', { emitEvent: false });
    this.applyFilters();
  }

  onCreateSupplier(): void {
    this.navigationUtilities.goToRouteWithState(PathNames.supplierForm);
  }

  onEditSupplier(supplier: Supplier): void {
    this.navigationUtilities.goToRouteWithQueryParams(PathNames.supplierForm, { id: supplier.id });
  }

  onDeleteSupplier(supplier: Supplier): void {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le fournisseur ${supplier.name} ?`;
    
    if (confirm(confirmMessage)) {
      this.errorHandlingUtilities.wrapOperation(
        this.supplierService.deleteSupplier(supplier.id!),
        'Suppression du fournisseur',
        'Fournisseur supprimé avec succès!',
      ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadSuppliers();
        }
      });
    }
  }
}