import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, takeUntil } from 'rxjs/operators';

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

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  roles: UserRole[];
  badge?: number;
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
  @ViewChild('drawer') drawer!: MatSidenav;

  currentUser!: User;
  UserRole = UserRole;
  cartSummary$: Observable<CartSummary>;
  
  // Sujet pour gérer la désinscription des observables
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
      label: 'Products & Stock',
      route: '/products',
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE]
    },
    {
      icon: 'shopping_cart',
      label: 'Orders',
      route: PathNames.orders,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE],
      badge: 5 // Exemple: nouvelles commandes
    },
    {
      icon: 'point_of_sale',
      label: 'Point of Sale',
      route: PathNames.pos,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE]
    },
    {
      icon: 'people',
      label: 'Gestion Clients',
      route: PathNames.users,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE]
    },
    {
      icon: 'analytics',
      label: 'Reports & Analytics',
      route: PathNames.reports,
      roles: [UserRole.ADMIN]
    },
    {
      icon: 'admin_panel_settings',
      label: 'Store Administration',
      route: PathNames.admin,
      roles: [UserRole.ADMIN]
    },
    {
      icon: 'settings',
      label: 'Settings',
      route: PathNames.settings,
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
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER]
    },
    {
      icon: 'account_circle',
      label: 'Mon Espace Client',
      route: PathNames.profile,
      roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER]
    }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private userService: UserService,
    private cartService: CartService,
    private router: Router
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

  /**
   * Charge le profil complet de l'utilisateur depuis l'API.
   * Le serveur identifie l'utilisateur via le token JWT.
   */
  private loadUserProfile(): void {
    this.userService.getCurrentUserProfile().subscribe({
      next: (fullProfile) => {
        this.currentUser = fullProfile;
        console.log('Profil utilisateur chargé:', this.currentUser);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.authService.logout().subscribe({
      next: (response) => {
        console.log('Déconnexion réussie:', response);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Erreur lors de la déconnexion:', error);
        this.router.navigate(['/login']);
      }
    });
      }
    });
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

  onLogout(): void {
    // Déconnecter l'utilisateur
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Déconnexion réussie:', response);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Erreur lors de la déconnexion:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`;
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    return this.currentUser.roles.map(role => role).join(', ');
  }

  getPageTitle(): string {
    const url = this.router.url.replace('/', '');
    switch (url) {
      case PathNames.dashboard:
        return 'Dashboard';
      case PathNames.catalog:
        return 'Catalogue Boutique';
      case PathNames.productDetails:
        return 'Détails du Produit';
      case PathNames.profile:
        return 'Mon Profil';
      case PathNames.pos:
        return 'Point of Sale';
      case PathNames.users:
        return 'Clients';
      case PathNames.reports:
        return 'Rapports & Analytics';
      case PathNames.admin:
        return 'Administration';
      default:
        return 'Store Manager';
    }
  }
}
