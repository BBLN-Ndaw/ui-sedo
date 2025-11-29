import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { User, UserRole, CartSummary } from '../shared/models';
import { UserService } from '../services/user.service';
import { PathNames } from '../constant/path-names.enum';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  roles: UserRole[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  currentUser?: User;
  UserRole = UserRole;
  cartSummary$: Observable<CartSummary>;
  
  private destroy$ = new Subject<void>();

  menuItems: MenuItem[] = [
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: PathNames.dashboard,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE]
    },
    {
      icon: 'inventory_2',
      label: 'Produits & Stock',
      route: PathNames.productsList,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE]
    },
        {
      icon: 'shopping_cart',
      label: 'Gestion Commandes',
      route: PathNames.ordersManagement,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE],
    },
    {
      icon: 'people',
      label: 'Gestion Clients',
      route: PathNames.users,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE]
    },
    {
      icon: 'business',
      label: 'Gestion Fournisseurs',
      route: PathNames.suppliers,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE]
    },
    {
      icon: 'category',
      label: 'Gestion Catégories',
      route: PathNames.categories,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE]
    },
    {
      icon: 'admin_panel_settings',
      label: 'Gestion Magasin',
      route: PathNames.storeManagement,
      roles: [UserRole.ADMIN]
    },
    //Menu pour tous les utilisateurs
    {
      icon: 'storefront',
      label: 'Catalogue Boutique',
      route: PathNames.catalog,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER]
    },
    {
      icon: 'shopping_bag',
      label: 'Mes Commandes',
      route: PathNames.orders,
      roles: [UserRole.CUSTOMER]
    },
    {
      icon: 'account_circle',
      label: 'Mon Espace Client',
      route: PathNames.profile,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER]
    }
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private cartService: CartService,
    private router: Router,
    private errorHandlingUtilities: ErrorHandlingUtilities,

  ) {
    // Initialiser l'observable du résumé du panier
    this.cartSummary$ = this.cartService.cartSummary$;
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserProfile(): void {
    if(this.authService.isPublicRoute(this.router.url)) { // Ne pas charger le profil pour les routes publiques
      return;
    }
    this.errorHandlingUtilities.wrapOperation(
      this.userService.getCurrentUserProfile(),
      'chargement du profil utilisateur'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (fullProfile) => {
        this.currentUser = fullProfile;
      },
      error: () => {
        this.authService.logout().subscribe(() => this.router.navigate(['/login']));
      }
    });
  }

  onLogout(): void {
    this.errorHandlingUtilities.wrapOperation(
    this.authService.logout(),
      'déconnexion'
    )
    .pipe(takeUntil(this.destroy$))
   .subscribe(() => this.router.navigate(['/login']))
  }
  onLogin(): void {
    this.router.navigate(['/login']);
  }

  get filteredMenuItems(): MenuItem[] {
    if (!this.currentUser) return [];
    return this.menuItems.filter(item =>
      this.currentUser!.roles.some(userRole => item.roles.includes(userRole as UserRole))
    );
  }

  onMenuItemClick(route: string): void {
    this.router.navigate([route]);
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`;
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    return this.currentUser.roles.map(role => role).join(', ');
  }
}
