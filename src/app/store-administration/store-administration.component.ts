import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { DashboardService, DashboardStats, RecentActivity } from '../services/dashboard.service';
import { NavigationUtilities } from '../services/navigation.utilities';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { NotificationService } from '../services/notification.service';

// Models
import { DashboardCard, User } from '../shared/models';
import { PathNames } from '../constant/path-names.enum';

// RxJS
import { Subject, takeUntil } from 'rxjs';


interface SystemModule {
  name: string;
  description: string;
  icon: string;
  route?: string;
  color: string;
  status: 'active' | 'inactive' | 'maintenance';
  action?: () => void;
}

@Component({
  selector: 'app-store-administration',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTableModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './store-administration.component.html',
  styleUrl: './store-administration.component.scss'
})
export class StoreAdministrationComponent implements OnInit, OnDestroy {

  // État du composant
  isLoading = false;
  currentUser!: User;
  dashboardStats!: DashboardStats;
  recentActivities: RecentActivity[] = [];
  adminCards: DashboardCard[] = [];
  systemModules: SystemModule[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private navigationUtilities: NavigationUtilities,
    private errorHandlingUtilities: ErrorHandlingUtilities,
    private notificationService: NotificationService
  ) {
    this.initializeSystemModules();
  }

  ngOnInit(): void {
    this.loadAdminDashboardData();
    this.loadRecentActivities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAdminDashboardData(): void {
    this.isLoading = true;
    this.errorHandlingUtilities.wrapOperation(
      this.dashboardService.getDashboardStats(),
      'chargement des statistiques d\'administration'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.updateAdminCards(stats);
        this.isLoading = false;
      }
    });
  }

  private loadRecentActivities(): void {
    this.errorHandlingUtilities.wrapOperation(
      this.dashboardService.getRecentActivities(),
      'chargement des activités récentes'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (activities) => {
        this.recentActivities = activities.slice(0, 10); // Dernières 10 activités
      }
    });
  }

  private updateAdminCards(stats: DashboardStats): void {
    this.adminCards = [
      {
        title: 'Revenus du Jour',
        value: this.dashboardService.formatCurrency(stats.dailySales),
        icon: 'account_balance_wallet',
        color: 'primary',
        description: 'Chiffre d\'affaires aujourd\'hui',
        route: PathNames.ordersManagement
      },
      {
        title: 'Produits en Stock',
        value: stats.productsInStock || stats.productsInStock,
        icon: 'inventory_2',
        color: 'accent',
        description: 'Articles disponibles',
        route: PathNames.productsList
      },
      {
        title: 'Commandes en Cours',
        value: stats.processingOrders,
        icon: 'pending_actions',
        color: 'warning',
        description: 'À traiter aujourd\'hui',
        route: PathNames.ordersManagement
      }
    ];
  }

  private initializeSystemModules(): void {
    this.systemModules = [
      {
        name: 'Gestion Utilisateurs',
        description: 'Administration des comptes, rôles et permissions',
        icon: 'admin_panel_settings',
        route: PathNames.users,
        color: 'primary',
        status: 'active'
      },
      {
        name: 'Gestion Produits',
        description: 'Catalogue, stock et fournisseurs',
        icon: 'inventory',
        route: PathNames.productsList,
        color: 'success',
        status: 'active'
      },
      {
        name: 'Gestion Commandes',
        description: 'Traitement et suivi des commandes',
        icon: 'shopping_cart_checkout',
        route: PathNames.ordersManagement,
        color: 'accent',
        status: 'active'
      },
      {
        name: 'Gestion Catégories',
        description: 'Organisation du catalogue produits',
        icon: 'category',
        route: PathNames.categories,
        color: 'primary',
        status: 'active'
      },
      {
        name: 'Gestion Fournisseurs',
        description: 'Partenaires et approvisionnement',
        icon: 'business',
        route: PathNames.suppliers,
        color: 'success',
        status: 'active'
      },
      {
        name: 'Rapports & Analytics',
        description: 'Analyses et insights business',
        icon: 'analytics',
        route: PathNames.reports,
        color: 'accent',
        status: 'active'
      },
      {
        name: 'Configuration Système',
        description: 'Paramètres et préférences',
        icon: 'settings',
        route: PathNames.settings,
        color: 'warning',
        status: 'maintenance'
      },
      {
        name: 'Point de Vente',
        description: 'Système de caisse intégré',
        icon: 'point_of_sale',
        route: PathNames.pos,
        color: 'primary',
        status: 'maintenance'
      }
    ];
  }

  onCardClick(card: DashboardCard): void {
    if (card.route) {
        this.navigationUtilities.goToRoute(card.route);
    } 
  }

  // Actions des modules système
  onModuleClick(module: SystemModule): void {
    if (module.status === 'maintenance') {
      this.notificationService.showInfo(`Le module "${module.name}" est en cours de développement.`);
      return;
    }
    
    if (module.route) {
        this.navigationUtilities.goToRoute(module.route);
    } else if (module.action) {
      module.action();
    }
  }

  // Actions rapides
  createNewUser(): void {
    this.navigationUtilities.goToRoute(PathNames.userForm);
  }

  createNewProduct(): void {
    this.navigationUtilities.goToRoute(PathNames.productForm);
  }

  viewSystemLogs(): void {
    this.notificationService.showInfo('Fonctionnalité de logs en cours de développement');
  }

  backupSystem(): void {
    this.notificationService.showInfo('Sauvegarde système en cours de développement');
  }

  // Utilitaires
  getModuleStatusIcon(status: string): string {
    switch (status) {
      case 'active': return 'check_circle';
      case 'inactive': return 'cancel';
      case 'maintenance': return 'build';
      default: return 'help';
    }
  }

  getModuleStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'maintenance': return 'warning';
      default: return 'primary';
    }
  }

  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'sale': return 'shopping_cart';
      case 'order': return 'receipt';
      case 'stock': return 'inventory_2';
      case 'customer': return 'person';
      default: return 'info';
    }
  }
}