import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HelloComponent } from './hello/hello.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [LoginGuard]
  },
  { 
    path: 'hello', 
    component: HelloComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/login' }
];
