import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

// Angular Material
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../shared/models';
import { UserService } from '../../services/user.service';
import { PathNames } from '../../constant/path-names.enum';

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
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatSidenav;

  currentUser!: User;
  UserRole = UserRole;

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
      label: 'Customers',
      route: PathNames.customers,
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
    // Menu spécifique aux client
    {
      icon: 'shopping_bag',
      label: 'Mes Commandes',
      route: PathNames.orders,
      roles: [UserRole.CUSTOMER]
    },
    {
      icon: 'account_circle',
      label: 'Mon Profil',
      route: PathNames.profile,
      roles: [UserRole.CUSTOMER]
    }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
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
      case PathNames.customers:
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
