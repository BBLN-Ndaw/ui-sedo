import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { OrderService } from '../../services/order.service';
import { OrdersListComponent } from '../../shared/components/orders-list/orders-list.component';
import { OrderStatus, Order } from '../../shared/models';
import { PathNames } from '../../constant/path-names.enum';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    OrdersListComponent
  ],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();
  private router = inject(Router);

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedStatus: string = '';
  selectedPeriod: string = '';
  isLoading = false;

  ngOnInit() {
    this.loadOrders();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders() {
    this.isLoading = true;
    this.orderService.getUserOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          console.log('my orders component : Orders loaded:', orders);
          this.orders = orders;
          this.filteredOrders = [...this.orders];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.snackBar.open('Erreur lors du chargement des commandes', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
  }

  filterOrders() {
    this.filteredOrders = this.orders.filter(order => {
      let matchesStatus = true;
      let matchesPeriod = true;

      // Filtre par statut
      if (this.selectedStatus) {
        matchesStatus = order.status === this.selectedStatus;
      }

      // Filtre par période
      if (this.selectedPeriod) {
        const orderDate = new Date(order.createdAt!);
        const now = new Date();
        
        switch (this.selectedPeriod) {
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesPeriod = orderDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            matchesPeriod = orderDate >= monthAgo;
            break;
          case 'quarter':
            const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            matchesPeriod = orderDate >= quarterAgo;
            break;
          case 'year':
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            matchesPeriod = orderDate >= yearAgo;
            break;
        }
      }

      return matchesStatus && matchesPeriod;
    });
  }

  refreshOrders() {
    this.selectedStatus = '';
    this.selectedPeriod = '';
    this.loadOrders();
  }

  getEmptyStateTitle(): string {
    if (this.selectedStatus || this.selectedPeriod) {
      return 'Aucune commande trouvée';
    }
    return 'Aucune commande';
  }

  getEmptyStateMessage(): string {
    if (this.selectedStatus || this.selectedPeriod) {
      return 'Aucune commande ne correspond aux filtres sélectionnés';
    }
    return 'Vous n\'avez pas encore passé de commande';
  }

  // Statistiques
  getTotalSpent(): number {
    return this.orders.reduce((total, order) => total + order.totalAmount, 0);
  }

  getAverageOrderValue(): number {
    if (this.orders.length === 0) return 0;
    return this.getTotalSpent() / this.orders.length;
  }

  getDeliveredOrders(): number {
    return this.orders.filter(order => order.status === 'DELIVERED').length;
  }

    goBack(): void {
      this.router.navigate([PathNames.catalog]);
    }
}
