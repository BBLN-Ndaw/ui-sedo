import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { UserService } from '../services/user.service';
import { OrderService} from '../services/order.service';
import { LoyaltyService, LoyaltyProgram } from '../services/loyalty.service';
import { Order, User } from '../shared/models';
import { OrderDetailsDialogComponent } from '../order-details-dialog/order-details-dialog.component';
import { OrdersListComponent } from '../orders-list/orders-list.component';
import { WishlistComponent } from '../wishlist/wishlist.component';
import {  Subject, takeUntil, filter } from 'rxjs';
import { PathNames } from '../constant/path-names.enum';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatListModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    OrdersListComponent,
    WishlistComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private orderService = inject(OrderService);
  private loyaltyService = inject(LoyaltyService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);

    private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  isEditingProfile = false;
  isChangingPassword = false;

  recentOrders: Order[] = [];

  loyaltyProgram: LoyaltyProgram | null = null;

  constructor() {  }

  ngOnInit() {
     this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.pattern("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")]],
      phone: ['', [Validators.pattern(/^(?:(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4})$/)]],
      address: [''],
      city: [''],
      postalCode: ['', [Validators.pattern(/^[0-9]{5}$/)]],
      country: ['France']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });


    this.loadUserProfile();
    this.loadOrders();
    this.loadLoyaltyProgram();
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        // Si on arrive sur le profile depuis une autre page, rafraîchir les données
        if (event.url === '/profile' || event.url.includes('/profile')) {
          console.log('Navigation vers profile detectée, rafraîchissement des données');
          this.refreshUserData();
        }
      });
  }

  /* unsubscribe from all observables */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserProfile() {
    this.errorHandlingUtilities.wrapOperation(
      this.userService.currentUser$,
      'chargement du profil utilisateur'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user: User | null) => {
        this.currentUser = user;
        if (user) {
          this.profileForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            address: user.address.street,
            city: user.address.city,
            postalCode: user.address.postalCode,
            country: user.address.country,
            phone: user.numTel
          });
        }
      }
    });
  }

  loadOrders() {
    this.errorHandlingUtilities.wrapOperation(
      this.orderService.getUserOrders(),
      'chargement des commandes'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (orders) => {
        console.log('profile component : Orders loaded:', orders);
        this.recentOrders = orders;
      }
    });
  }

  loadLoyaltyProgram() {
    this.errorHandlingUtilities.wrapOperation(
      this.loyaltyService.getMyLoyaltyProgram(),
      'chargement du programme de fidélité'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (loyaltyProgram) => {
        console.log('Loyalty program loaded:', loyaltyProgram);
        this.loyaltyProgram = loyaltyProgram;
      }
    });
  }
  /**
   * Recharge toutes les données utilisateur (à appeler après une nouvelle commande)
   */
  refreshUserData() {
    console.log('Refreshing user data...');
    this.loadOrders();
    this.loadLoyaltyProgram();
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  getUserInitials(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }

  getLoyaltyProgress(): number {
    if (!this.loyaltyProgram || this.loyaltyProgram.nextLevelPoints === 0) {
      return 100;
    }
    return this.loyaltyProgram.progress;
  }

  toggleEditProfile() {
    if (this.isEditingProfile) {
      this.onSaveProfile();
    } else {
      this.isEditingProfile = true;
    }
  }

  onSaveProfile() {
    if (this.profileForm.valid && this.currentUser) {
      const updatedUser: User = { ...this.currentUser, ...this.profileForm.value };
      console.log('Updating profile with:', updatedUser);
      
      this.errorHandlingUtilities.wrapOperation(
        this.userService.updateUserById(String(this.currentUser.id), updatedUser),
        'mise à jour du profil',
        'Profil mis à jour avec succès'
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          console.log('Profile updated successfully:', user);
          this.currentUser = user;
          this.isEditingProfile = false;
        }
      });
    }
  }

  onCancelEdit() {
    this.isEditingProfile = false;
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        address: this.currentUser.address.street,
        city: this.currentUser.address.city,
        postalCode: this.currentUser.address.postalCode,
        country: this.currentUser.address.country,
        phone: this.currentUser.numTel
      });
    }
  }

  onChangePassword() {
    if (this.passwordForm.valid && this.currentUser) {
      const changePasswordRequest = { ...this.passwordForm.value };
      this.errorHandlingUtilities.wrapOperation(
        this.userService.updatePassword(String(this.currentUser.id), changePasswordRequest),
        "Modification du mot de passe",
        "Mot de passe modifié avec succès"
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.isChangingPassword = false;
        }
      });
    }
  }

  openOrderDetails(orderId: string) {
    const dialogRef = this.dialog.open(OrderDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { orderId },
      panelClass: 'order-details-dialog-container'
    });

    dialogRef.afterClosed()
    .subscribe(result => {
      if (result === 'reorder') {
        
      }
    });
  }


  goBack(): void {
    this.router.navigate([PathNames.catalog]);
  }
}
