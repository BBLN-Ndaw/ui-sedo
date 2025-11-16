import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { DashboardService, DashboardStats, RecentActivity } from '../services/dashboard.service';
import { NavigationUtilities } from '../services/navigation.utilities';
import { Subject, takeUntil } from 'rxjs';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { Product, TopSellingProductDto } from '../shared/models';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  description?: string;
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
    MatChipsModule,
    MatTabsModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {

  dashboardCards: DashboardCard[] = [];
  recentActivities: RecentActivity[] = [];
  lowStockProducts: Product[] = [];
  topSellingProducts: TopSellingProductDto[] = [];
  currentDate: Date = new Date();
  
  // Propriétés pour le graphique de revenus mensuels
  monthlyRevenueData: { month: string; value: number; percentage: number; formattedValue: string }[] = [];
  totalYearRevenue: number = 0;
  currentMonthRevenue: number = 0;
  monthlyGrowth: number = 0;
  
  private destroy$ = new Subject<void>();


  constructor(
    private dashboardService: DashboardService,
    private navigationUtilities: NavigationUtilities,
    private errorHandlingUtilities: ErrorHandlingUtilities,

  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadRecentActivitiesNotifications();
    this.getLowStockProducts()
    this.loadTopSellingProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.errorHandlingUtilities.wrapOperation(
      this.dashboardService.getDashboardStats(),
      "chargement des statistiques du tableau de bord"
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (stats) => {
        this.updateDashboardCards(stats);
        if (stats.revenuePerMonthInCurrentYear) {
          this.processMonthlyRevenueData(stats.revenuePerMonthInCurrentYear);
        }
      }
    });
  }

  loadRecentActivitiesNotifications(): void {
    this.errorHandlingUtilities.wrapOperation(
      this.dashboardService.getRecentActivities(),
      "chargement des activités récentes"
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe(activities => {
      this.recentActivities = activities;
    });
  }

  private loadTopSellingProducts(): void {
    this.errorHandlingUtilities.wrapOperation(
      this.dashboardService.getTopSellingProducts(5),
      "chargement des produits les plus vendus"
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (products) => {
        this.topSellingProducts = products;
      }
    });
  }

  private getLowStockProducts(): void {
    this.errorHandlingUtilities.wrapOperation(
      this.dashboardService.getLowStockProducts(),
      "chargement des produits en rupture de stock"
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (products) => {
        this.lowStockProducts = products;
      },
    });
  }

  private updateDashboardCards(stats: DashboardStats): void {
    this.dashboardCards = [
      {
        title: 'Ventes du Jour',
        value: this.dashboardService.formatCurrency(stats.dailySales),
        icon: 'trending_up',
        color: 'primary',
        description: 'Revenus générés aujourd\'hui'
      },
      {
        title: 'Commandes à Traiter',
        value: stats.processingOrders,
        icon: 'shopping_cart',
        color: 'accent',
        description: 'Commandes en cours de traitement'
      },
      {
        title: 'Produits en Stock',
        value: stats.productsInStock,
        icon: 'inventory_2',
        color: 'success',
        description: 'Articles disponibles à la vente'
      },
      {
        title: 'Commandes anulées',
        value: stats.monthlyCancelledOrders,
        icon: 'people',
        color: 'warning',
        description: 'Commandes annulées ce mois-ci'
      },
      {
        title: 'Revenus Mensuel',
        value: this.dashboardService.formatCurrency(stats.monthlyRevenue),
        icon: 'account_balance_wallet',
        color: 'success',
        description: 'Chiffre d\'affaires du mois'
      },
      {
        title: 'Panier Moyen',
        value: this.dashboardService.formatCurrency(stats.averageOrderValue),
        icon: 'shopping_basket',
        color: 'primary',
        description: 'Valeur moyenne des commandes'
      }
    ];
  }

  private processMonthlyRevenueData(revenueMap: Map<string, number> | any): void {
    if (!revenueMap) {
      return;
    }
        
    // month names in french for display
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // month mapping from English to index (0-11)
    const monthMapping: { [key: string]: number } = {
      'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3,
      'MAY': 4, 'JUNE': 5, 'JULY': 6, 'AUGUST': 7,
      'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
    };
    
      // Initialize an array for the 12 months
      const monthlyData: number[] = new Array(12).fill(0);
      
      // Process backend data
        Object.entries(revenueMap).forEach(([monthKey, value]) => {
          const monthIndex = monthMapping[monthKey.toUpperCase()];
          if (monthIndex !== undefined && typeof value === 'number') {
            monthlyData[monthIndex] = value;
          }
        });
      
      // Calculate total annual revenue
      this.totalYearRevenue = monthlyData.reduce((sum, value) => sum + value, 0);
      
      // Find the maximum revenue to calculate percentages
      const maxRevenue = Math.max(...monthlyData);
      
      // Prepare data for the chart
      this.monthlyRevenueData = monthlyData.map((value, index) => ({
        month: monthNames[index],
        value: value,
        percentage: maxRevenue > 0 ? (value / maxRevenue) * 100 : 0,
        formattedValue: this.dashboardService.formatCurrency(value)
      }));
      
      // Calculate current month revenue
      const currentMonth = new Date().getMonth(); // 0-11
      this.currentMonthRevenue = monthlyData[currentMonth] || 0;
      
      // Calculate growth compared to previous month
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousMonthRevenue = monthlyData[previousMonth] || 0;
      
      if (previousMonthRevenue > 0) {
        this.monthlyGrowth = ((this.currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
      } else {
        this.monthlyGrowth = this.currentMonthRevenue > 0 ? 100 : 0;
      }
      
    
  }


  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }

  getCurrentMonthName(): string {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    return monthNames[currentMonth];
  }

  trackByMonth(index: number, item: any): string {
    return item.month;
  }

  navigateToOrdersManagement(): void {
    this.navigationUtilities.goToOrdersManagement();
  }

  navigateToProductCreation(): void {
    this.navigationUtilities.goToCreateProduct();
  }

  navigateToCustomerCreation(): void {
    this.navigationUtilities.goToUserCreation();
  }

  navigateToSupplierCreation(): void {
    this.navigationUtilities.goToSupplierCreation();  
  }
}
