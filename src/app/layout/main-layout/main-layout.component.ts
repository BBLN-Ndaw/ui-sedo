import { Component, OnInit, ViewChild } from '@angular/core';
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

  isHandset$!: Observable<boolean>;

  currentUser: User | null = null;
  UserRole = UserRole;

  menuItems: MenuItem[] = [
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      roles: [UserRole.OWNER, UserRole.EMPLOYEE]
    },
    {
      icon: 'inventory_2',
      label: 'Products & Stock',
      route: '/products',
      roles: [UserRole.OWNER, UserRole.EMPLOYEE]
    },
    {
      icon: 'shopping_cart',
      label: 'Orders',
      route: '/orders',
      roles: [UserRole.OWNER, UserRole.EMPLOYEE],
      badge: 5 // Exemple: nouvelles commandes
    },
    {
      icon: 'point_of_sale',
      label: 'Point of Sale',
      route: '/pos',
      roles: [UserRole.OWNER, UserRole.EMPLOYEE]
    },
    {
      icon: 'people',
      label: 'Customers',
      route: '/customers',
      roles: [UserRole.OWNER, UserRole.EMPLOYEE]
    },
    {
      icon: 'analytics',
      label: 'Reports & Analytics',
      route: '/reports',
      roles: [UserRole.OWNER]
    },
    {
      icon: 'admin_panel_settings',
      label: 'Store Administration',
      route: '/admin',
      roles: [UserRole.OWNER]
    },
    {
      icon: 'settings',
      label: 'Settings',
      route: '/settings',
      roles: [UserRole.OWNER]
    },
    // Menu spécifique aux clients
    {
      icon: 'storefront',
      label: 'Shop Catalog',
      route: '/shop',
      roles: [UserRole.CUSTOMER]
    },
    {
      icon: 'shopping_bag',
      label: 'My Orders',
      route: '/my-orders',
      roles: [UserRole.CUSTOMER]
    },
    {
      icon: 'account_circle',
      label: 'My Profile',
      route: '/profile',
      roles: [UserRole.CUSTOMER]
    }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialiser isHandset$ après l'injection des dépendances
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );

    // Simuler l'utilisateur connecté pour le moment
    this.currentUser = {
      id: 1,
      username: 'owner',
      email: 'owner@store.com',
      firstName: 'Store',
      lastName: 'Owner',
      role: UserRole.OWNER,
      isActive: true,
      createdAt: new Date()
    };
  }

  get filteredMenuItems(): MenuItem[] {
    if (!this.currentUser) return [];
    return this.menuItems.filter(item => 
      item.roles.includes(this.currentUser!.role)
    );
  }

  onMenuItemClick(route: string): void {
    this.router.navigate([route]);
    // Fermer le drawer sur mobile après clic
    this.isHandset$.subscribe(isHandset => {
      if (isHandset) {
        this.drawer.close();
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`;
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    switch (this.currentUser.role) {
      case UserRole.OWNER: return 'Store Owner';
      case UserRole.EMPLOYEE: return 'Store Employee';
      case UserRole.CUSTOMER: return 'Customer';
      default: return this.currentUser.role;
    }
  }
}
