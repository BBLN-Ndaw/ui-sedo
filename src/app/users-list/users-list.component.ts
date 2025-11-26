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

import { User, UserFilterOptions } from '../shared/models';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { FormatUtilities } from '../services/format.utilities';
import { UserService } from '../services/user.service';
import { NavigationUtilities } from '../services/navigation.utilities';
import { PathNames } from '../constant/path-names.enum';
import { ExportToExcelService } from '../services/export.to.excel.service';

@Component({
  selector: 'app-users-list',
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
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private userService = inject(UserService);
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);
  private navigationUtilities = inject(NavigationUtilities);
  private formatUtilities = inject(FormatUtilities);
  private exportToExcelService = inject(ExportToExcelService);

  // État du composant
  loading = false;
  totalUsers = 0;  
  // Contrôles de formulaire
  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  ordersFilter = new FormControl('all');
  
  // Options de filtre
  statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ];
  
  ordersOptions = [
    { value: 'all', label: 'Tous les utilisateurs' },
    { value: 'with-orders', label: 'Avec commandes' },
    { value: 'no-orders', label: 'Sans commandes' }
  ];

  // Table
  displayedColumns: string[] = [
    'userName',
    'fullName',
    'email',
    'numTel',
    'totalOrders',
    'totalSpent',
    'registrationDate',
    'isActive',
    'actions'
  ];

  dataSource = new MatTableDataSource<User>([]);

  // Pagination
  currentPage = 0;
  currentPageSize = 20;

  // Gestion des abonnements
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.setupFilters();
    this.loadUsers();
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

    // Filtres de statut et commandes
    this.statusFilter.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });

    this.ordersFilter.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  private loadUsers(): void {
    this.loading = true;
    
    const filters = this.buildFilters();
    const page = this.currentPage;
    const size = this.currentPageSize;

     this.errorHandlingUtilities.wrapOperation(
      this.userService.getUsers(page, size, filters),
      'chargement des utilisateurs',
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.dataSource.data = response.content;
        this.totalUsers = response.totalElements;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.loading = false;
      }
    });
  }

  private buildFilters(): UserFilterOptions {
    const filters: UserFilterOptions = {};

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

    const orders = this.ordersFilter.value;
    if (orders === 'with-orders') {
      filters.hasOrders = true;
    } else if (orders === 'no-orders') {
      filters.hasOrders = false;
    }

    return filters;
  }

  private applyFilters(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadUsers();
  }

  onViewUserDetails(user: User): void {
    this.navigationUtilities.goToRouteWithId(PathNames.userDetails, user.id!);
  }
 
  onUpdateStatus(user: User): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    this.errorHandlingUtilities.wrapOperation(
      this.userService.updateUserStatus(user.id!, action),
      'Mise à jour du statut de l\'utilisateur'
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
        next: () => {
          this.loadUsers();
        }
      });
  }

  onViewUserOrders(user: User): void {
    this.navigationUtilities.goToRouteWithState(PathNames.orders, user);
  }

  onPageChange(event: PageEvent): void {
    
    this.currentPage = event.pageIndex;
    this.currentPageSize = event.pageSize;
    
    if (this.paginator) {
      this.paginator.pageSize = event.pageSize;
      this.paginator.pageIndex = event.pageIndex;
    }
    
    this.loadUsers();
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  formatCurrency(amount: number | undefined): string {
    return this.formatUtilities.formatCurrency(amount || 0);
  }

  formatDate(date: Date): string {
    return this.formatUtilities.formatDate(date );
  }

  getStatusChipColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Actif' : 'Inactif';
  }

  onExportUsers(): void {
    this.errorHandlingUtilities.wrapOperation(
      this.userService.getAllUsers(),
      'export des utilisateurs')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.exportToExcelService.exportUserDataToExcel(users);
        }
      });
  }

  onRefreshUsers(): void {
    this.loadUsers();
  }

  onClearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusFilter.setValue('all', { emitEvent: false });
    this.ordersFilter.setValue('all', { emitEvent: false });
    this.applyFilters();
  }

  onCreateUser(): void {
    this.navigationUtilities.goToRouteWithState(PathNames.userForm);
  }

  onEditUser(user: User): void {
    this.navigationUtilities.goToRouteWithQueryParams(PathNames.userForm, { id: user.id });
  }

  onDeleteUser(user: User): void {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.firstName} ${user.lastName} ?`;
    
    if (confirm(confirmMessage)) {
      this.errorHandlingUtilities.wrapOperation(
        this.userService.deleteUser(user.id!),
        'Suppression de l\'utilisateur',
        'Utilisateur supprimé avec succès!',
      ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUsers();
        }
      });
    }
  }
}