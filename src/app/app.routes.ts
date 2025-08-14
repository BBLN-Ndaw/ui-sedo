import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CatalogComponent } from './catalog/catalog.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';
import { RoleGuard } from './guards/role.guard';
import { UserRole } from './shared/models';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [LoginGuard]
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
         path: 'profile',
         component: ProfileComponent
      },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      
    ]
  },
  { path: '**', redirectTo: '/login' }
];
