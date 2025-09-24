import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SetPasswordComponent } from './set-password/set-password.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CatalogComponent } from './catalog/catalog.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { CartComponent } from './cart/cart.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';
import { RoleGuard } from './guards/role.guard';
import { UserRole } from './shared/models';
import { ProfileComponent } from './profile/profile.component';
import { MyOrdersComponent } from './my-orders/my-orders.component';
import { PaypalComponentComponent } from './paypal-component/paypal-component.component';
import { PaymentConfirmationComponent } from './payment-confirmation/payment-confirmation.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { UsersListComponent } from './users-list/users-list.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UserFormComponent } from './user-form/user-form.component';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [LoginGuard]
  },
  { 
    path: 'set-password', 
    component: SetPasswordComponent
  },
  { path: 'logout', redirectTo: '/login' },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
         path: 'dashboard',
         canActivate: [RoleGuard],
         data: { roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
         component: DashboardComponent
      },
      {
         path: 'catalog',
         component: CatalogComponent
      },
      {
         path: 'catalog/product/details',
         component: ProductDetailsComponent
      },
      {
         path: 'cart',
         component: CartComponent
      },
      {
         path: 'profile',
         component: ProfileComponent
      },
      {
         path: 'orders',
         component: MyOrdersComponent
      },
      {
         path: 'users',
         canActivate: [RoleGuard],
         data: { roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
         component: UsersListComponent
      },
      {
         path: 'users/details/:id',
         canActivate: [RoleGuard],
         data: { roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
         component: UserDetailsComponent
      },
      {
         path: 'user-form',
         canActivate: [RoleGuard],
         data: { roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
         component: UserFormComponent
      },
      {
         path: 'wishlist',
         component: WishlistComponent
      },
      {
         path: 'payment',
         component: PaypalComponentComponent
      },
      {
         path: 'payment-confirmation',
         component: PaymentConfirmationComponent
      },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      
    ]
  },
  { path: '**', redirectTo: '/login' }
];
