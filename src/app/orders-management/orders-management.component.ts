import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Order, OrderStatus, OrderFilterOptions } from '../shared/models';
import { OrderService } from '../services/order.service';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { NavigationUtilities } from '../services/navigation.utilities';
import { OrderDetailsDialogComponent } from '../order-details-dialog/order-details-dialog.component';
import { StatusOptionsPipe } from '../shared/pipes/status-options.pipe';

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    StatusOptionsPipe
  ],
  templateUrl: './orders-management.component.html',
  styleUrls: ['./orders-management.component.scss']
})
export class OrdersManagementComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private destroy$ = new Subject<void>();
  
  // Exposer l'énumération pour le template
  readonly OrderStatus = OrderStatus;
  
  // État du composant
  isLoading = false;
  totalOrders = 0;
  
  // Contrôles de formulaire
  searchControl = new FormControl('');
  statusFilter = new FormControl('');
  periodFilter = new FormControl('');
  
  // Configuration de la table
  dataSource = new MatTableDataSource<Order>([]);
  displayedColumns: string[] = [
    'orderNumber', 
    'customerName', 
    'createdAt', 
    'status', 
    'totalAmount', 
    'actions'
  ];
  
  // Pagination
  currentPage = 0;
  currentPageSize = 20;
  
  // Options de filtre
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: OrderStatus.PENDING, label: 'En attente' },
    { value: OrderStatus.CONFIRMED, label: 'Confirmée' },
    { value: OrderStatus.PROCESSING, label: 'En préparation' },
    { value: OrderStatus.READY_FOR_PICKUP, label: 'Prête pour retrait' },
    { value: OrderStatus.SHIPPED, label: 'Expédiée' },
    { value: OrderStatus.DELIVERED, label: 'Livrée' },
    { value: OrderStatus.CANCELLED, label: 'Annulée' }
  ];
  
  periodOptions = [
    { value: '', label: 'Toute période' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' }
  ];

  constructor(
    private orderService: OrderService,
    private errorHandlingUtilities: ErrorHandlingUtilities,
    private navigationUtilities: NavigationUtilities,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupFilters();
    this.loadAllOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilters(): void {
    // Search avec debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });

    // Filtres de statut et période
    this.statusFilter.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });

    this.periodFilter.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  loadAllOrders(): void {
    this.isLoading = true;
    const filters = this.buildFilters();
    
    this.errorHandlingUtilities.wrapOperation(
      this.orderService.getAllOrdersPaginated(this.currentPage, this.currentPageSize, filters),
      'chargement des commandes'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('Orders loaded for management:', response);
        this.dataSource.data = response.content;
        this.totalOrders = response.totalElements;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private buildFilters(): OrderFilterOptions {
    const filters: OrderFilterOptions = {};
    
    const search = this.searchControl.value;
    if (search?.trim()) {
      filters.search = search.trim();
    }
    
    const status = this.statusFilter.value;
    if (status) {
      filters.status = status as OrderStatus;
    }
    
    const period = this.periodFilter.value;
    if (period) {
      filters.period = period;
    }
    
    return filters;
  }

  private applyFilters(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadAllOrders();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.currentPageSize = event.pageSize;
    
    if (this.paginator) {
      this.paginator.pageSize = event.pageSize;
      this.paginator.pageIndex = event.pageIndex;
    }
    
    this.loadAllOrders();
  }

  refreshOrders(): void {
    this.searchControl.reset();
    this.statusFilter.reset();
    this.periodFilter.reset();
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadAllOrders();
  }

  openOrderDetails(orderId: string): void {
    const dialogRef = this.dialog.open(OrderDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { orderId },
      panelClass: 'order-details-dialog-container'
    });

    dialogRef.afterClosed()
    .pipe(takeUntil(this.destroy$))
    .subscribe(result => {
      if (result === 'updated') {
        this.loadAllOrders();
      }
    });
  }

  changeOrderStatus(orderId: string, newStatus: OrderStatus): void {
    console.log(`Changement du statut de la commande ${orderId} vers ${newStatus}`);
    this.errorHandlingUtilities.wrapOperation(
      this.orderService.changeOrderStatus(orderId, newStatus),
      'modification du statut de la commande'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (updatedOrder) => {
        if (updatedOrder) {
          // Mettre à jour la commande dans le dataSource localement en attendant le rechargement complet
          const orderIndex = this.dataSource.data.findIndex(o => o.id === orderId);
          if (orderIndex !== -1) {
            const updatedData = [...this.dataSource.data];
            updatedData[orderIndex] = { ...updatedData[orderIndex], status: newStatus };
            this.dataSource.data = updatedData;
          }
        }
      }
    });
  }

  cancelOrder(orderId: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      this.changeOrderStatus(orderId, OrderStatus.CANCELLED);
    }
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'warn',
      [OrderStatus.CONFIRMED]: 'primary',
      [OrderStatus.PROCESSING]: 'accent',
      [OrderStatus.READY_FOR_PICKUP]: 'primary',
      [OrderStatus.SHIPPED]: 'primary',
      [OrderStatus.DELIVERED]: '',
      [OrderStatus.CANCELLED]: 'warn'
    };
    return colors[status] || '';
  }

  getStatusIcon(status: OrderStatus): string {
    const icons: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'schedule',
      [OrderStatus.CONFIRMED]: 'check_circle',
      [OrderStatus.PROCESSING]: 'autorenew',
      [OrderStatus.READY_FOR_PICKUP]: 'store',
      [OrderStatus.SHIPPED]: 'local_shipping',
      [OrderStatus.DELIVERED]: 'check_circle',
      [OrderStatus.CANCELLED]: 'cancel'
    };
    return icons[status] || 'help';
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'En attente',
      [OrderStatus.CONFIRMED]: 'Confirmée',
      [OrderStatus.PROCESSING]: 'En préparation',
      [OrderStatus.READY_FOR_PICKUP]: 'Prête pour retrait',
      [OrderStatus.SHIPPED]: 'Expédiée',
      [OrderStatus.DELIVERED]: 'Livrée',
      [OrderStatus.CANCELLED]: 'Annulée'
    };
    return labels[status] || 'Inconnu';
  }

  canChangeStatus(order: Order, newStatus: OrderStatus): boolean {
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      return false;
    }
    
    // Empêcher les transitions illogiques
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: []
    };
    
    return validTransitions[order.status]?.includes(newStatus) || false;
  }

  // Statistiques
  getTotalOrders(): number {
    return this.totalOrders;
  }

  getTotalRevenue(): number {
    return this.dataSource.data.reduce((sum: number, order: Order) => sum + order.totalAmount, 0);
  }

  getOrdersByStatus(status: OrderStatus): number {
    return this.dataSource.data.filter((order: Order) => order.status === status).length;
  }

  goBack(): void {
    this.navigationUtilities.goToDashboard();
  }

  getEmptyStateTitle(): string {
    const hasFilters = this.searchControl.value?.trim() || this.statusFilter.value || this.periodFilter.value;
    if (hasFilters) {
      return 'Aucune commande trouvée';
    }
    return 'Aucune commande';
  }

  getEmptyStateMessage(): string {
    const hasFilters = this.searchControl.value?.trim() || this.statusFilter.value || this.periodFilter.value;
    if (hasFilters) {
      return 'Aucune commande ne correspond aux filtres sélectionnés';
    }
    return 'Aucune commande n\'a été trouvée dans le système';
  }
}