import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Subject, takeUntil, switchMap, of } from 'rxjs';

import { User, Order } from '../shared/models';
import { UserService } from '../services/user.service';
import { OrderService } from '../services/order.service';
import { OrdersListComponent } from '../orders-list/orders-list.component';
import { OrderDetailsDialogComponent } from '../order-details-dialog/order-details-dialog.component';
import { FormatUtilities } from '../services/format.utilities';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { NavigationUtilities } from '../services/navigation.utilities';
import { PathNames } from '../constant/path-names.enum';

interface UserStatistics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  favoriteCategories: string[];
  registrationDate: Date;
  lastLoginDate?: Date;
  ordersThisMonth: number;
  ordersThisYear: number;
}

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    // OrdersListComponent
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private orderService = inject(OrderService);
  private formatUtilities = inject(FormatUtilities);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // État du composant
  loading = true;
  userId!: number;
  user: User | null = null;
  userStatistics: UserStatistics | null = null;
  userOrders: Order[] = [];

  constructor(
    private navigationUtilities: NavigationUtilities,
    private errorHandlingUtilities: ErrorHandlingUtilities
  ) {
    this.user = this.navigationUtilities.getStateData('userDetails');
  }
  
  // Gestion des abonnements
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // this.loadUserDetails();
    this.loadUserStatistics();
    this.loadUserOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // private loadUserDetails(): void {
  //   this.loading = true;
    
  //   this.route.params.pipe(
  //     switchMap(params => {
  //       this.userId = +params['id'];
  //       if (!this.userId) {
  //         this.router.navigate(['/users']);
  //         return of(null);
  //       }
  //       return this.userService.getUserById(this.userId);
  //     }),
  //     takeUntil(this.destroy$)
  //   ).subscribe({
  //     next: (user) => {
  //       if (user) {
  //         this.user = user;
  //         this.loadUserStatistics();
  //         this.loadUserOrders();
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Erreur lors du chargement des détails utilisateur:', error);
  //       this.snackBar.open('Erreur lors du chargement des détails utilisateur', 'Fermer', { duration: 5000 });
  //       this.router.navigate(['/users']);
  //       this.loading = false;
  //     }
  //   });
  // }

  private loadUserStatistics(): void {
    if (!this.user) return;

    // Construire les statistiques à partir des données utilisateur existantes
    const registrationDate = new Date(this.user.createdAt || new Date());
    
    this.userStatistics = {
      totalOrders: (this.user as any).totalOrders || 0,
      totalSpent: (this.user as any).totalSpent || 0,
      averageOrderValue: this.calculateAverageOrderValue(),
      lastOrderDate: (this.user as any).lastOrderDate,
      favoriteCategories: (this.user as any).favoriteCategories || [],
      registrationDate: registrationDate,
      lastLoginDate: (this.user as any).lastLoginDate,
      ordersThisMonth: (this.user as any).ordersThisMonth || 0,
      ordersThisYear: (this.user as any).ordersThisYear || 0
    };
  }

  private loadUserOrders(): void {
    if (!this.user) return;

    // Utiliser getUserOrders() du service existant
    this.orderService.getUserOrders().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (orders: Order[]) => {
        this.userOrders = orders.slice(0, 10); // Limiter à 10 commandes
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des commandes:', error);
        this.userOrders = [];
        this.loading = false;
      }
    });
  }

  private calculateAverageOrderValue(): number {
    if (!this.userStatistics?.totalOrders || this.userStatistics.totalOrders === 0) {
      return 0;
    }
    return this.userStatistics.totalSpent / this.userStatistics.totalOrders;
  }

  // Navigation
  goBackToUsersList(): void {
    this.navigationUtilities.goToRouteWithState(PathNames.users);
  }
  
  onUpdateStatus(): void {
    if (!this.user) return;
    const newStatus = !this.user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    this.errorHandlingUtilities.wrapOperation(
      this.userService.updateUserStatus(this.user.id, action),
      'Mise à jour du statut de l\'utilisateur'
    ).pipe(takeUntil(this.destroy$))
    .subscribe();
 }

  onViewAllOrders(): void {
    this.navigationUtilities.goToRouteWithQueryParams(PathNames.orders, { userId: this.userId });
  }

  onOrderDetails(orderId: string): void {
    this.dialog.open(OrderDetailsDialogComponent, {
      width: '800px',
      data: { orderId }
    });
  }

  // Utilitaires d'affichage
  getUserInitials(): string {
    if (!this.user) return '';
    return `${this.user.firstName[0]}${this.user.lastName[0]}`;
  }

  getFullName(): string {
    if (!this.user) return '';
    return `${this.user.firstName} ${this.user.lastName}`;
  }

  formatCurrency(amount: number): string {
    return this.formatUtilities.formatCurrency(amount);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Non défini';
    return this.formatUtilities.formatDate(date);
  }

  getStatusColor(): string {
    return this.user?.isActive ? 'primary' : 'warn';
  }

  getStatusText(): string {
    return this.user?.isActive ? 'Actif' : 'Inactif';
  }

  getStatusIcon(): string {
    return this.user?.isActive ? 'check_circle' : 'cancel';
  }

  getUserLoyaltyLevel(): string {
    const totalSpent = this.userStatistics?.totalSpent || 0;
    if (totalSpent >= 5000) return 'Platinum';
    if (totalSpent >= 2000) return 'Gold';
    if (totalSpent >= 500) return 'Silver';
    return 'Bronze';
  }

  getLoyaltyColor(): string {
    const level = this.getUserLoyaltyLevel();
    switch (level) {
      case 'Platinum': return 'accent';
      case 'Gold': return 'primary';
      case 'Silver': return 'basic';
      default: return 'basic';
    }
  }

  getAccountAge(): string {
    if (!this.userStatistics?.registrationDate) return '';
    
    const now = new Date();
    const registration = new Date(this.userStatistics.registrationDate);
    const diffTime = Math.abs(now.getTime() - registration.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} jour(s)`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
    return `${Math.floor(diffDays / 365)} an(s)`;
  }

  getActivityLevel(): string {
    const ordersThisMonth = this.userStatistics?.ordersThisMonth || 0;
    if (ordersThisMonth >= 5) return 'Très actif';
    if (ordersThisMonth >= 2) return 'Actif';
    if (ordersThisMonth >= 1) return 'Peu actif';
    return 'Inactif';
  }

  getActivityColor(): string {
    const ordersThisMonth = this.userStatistics?.ordersThisMonth || 0;
    if (ordersThisMonth >= 5) return 'primary';
    if (ordersThisMonth >= 2) return 'accent';
    if (ordersThisMonth >= 1) return 'warn';
    return 'basic';
  }
}