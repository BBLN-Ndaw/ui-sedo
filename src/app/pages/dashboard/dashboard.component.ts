import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

// Services
import { DashboardService, DashboardStats, LowStockProduct, RecentActivity } from '../../services/dashboard.service';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  dashboardStats: DashboardStats | null = null;
  dashboardCards: DashboardCard[] = [];
  recentActivities: RecentActivity[] = [];
  lowStockProducts: LowStockProduct[] = [];

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Charger les statistiques
    this.dashboardService.getDashboardStats().subscribe(stats => {
      this.dashboardStats = stats;
      this.updateDashboardCards(stats);
    });

    // Charger les activités récentes
    this.dashboardService.getRecentActivities().subscribe(activities => {
      this.recentActivities = activities;
    });

    // Charger les produits en rupture de stock
    this.dashboardService.getLowStockProducts().subscribe(products => {
      this.lowStockProducts = products;
    });
  }

  private updateDashboardCards(stats: DashboardStats): void {
    this.dashboardCards = [
      {
        title: 'Daily Sales',
        value: this.dashboardService.formatCurrency(stats.dailySales),
        icon: 'attach_money',
        color: 'primary',
        change: `${stats.salesChange > 0 ? '+' : ''}${stats.salesChange}%`,
        changeType: stats.salesChange >= 0 ? 'increase' : 'decrease'
      },
      {
        title: 'Total Orders',
        value: stats.totalOrders,
        icon: 'shopping_cart',
        color: 'accent',
        change: `${stats.ordersChange > 0 ? '+' : ''}${stats.ordersChange}%`,
        changeType: stats.ordersChange >= 0 ? 'increase' : 'decrease'
      },
      {
        title: 'Products in Stock',
        value: stats.productsInStock,
        icon: 'inventory',
        color: 'success',
        change: `${stats.stockChange > 0 ? '+' : ''}${stats.stockChange}%`,
        changeType: stats.stockChange >= 0 ? 'increase' : 'decrease'
      },
      {
        title: 'Active Customers',
        value: stats.activeCustomers,
        icon: 'people',
        color: 'warning',
        change: `${stats.customersChange > 0 ? '+' : ''}${stats.customersChange}%`,
        changeType: stats.customersChange >= 0 ? 'increase' : 'decrease'
      }
    ];
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'sale': return 'point_of_sale';
      case 'order': return 'shopping_bag';
      case 'stock': return 'warning';
      case 'customer': return 'person_add';
      default: return 'info';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'sale': return 'success';
      case 'order': return 'primary';
      case 'stock': return 'warning';
      case 'customer': return 'accent';
      default: return 'basic';
    }
  }

  getStockPercentage(current: number, min: number): number {
    return this.dashboardService.getStockPercentage(current, min);
  }

  getStockStatus(current: number, min: number): string {
    return this.dashboardService.getStockStatus(current, min);
  }
}
