import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { OrderService} from '../../services/order.service';
import { Order, OrderStatus, User } from '../../shared/models';
import { OrderDetailsDialogComponent } from '../../shared/components/order-details-dialog/order-details-dialog.component';
import { OrdersListComponent } from '../../shared/components/orders-list/orders-list.component';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';


interface Wishlist {
  id: number;
  name: string;
  price: number;
  image: string;
  availability: 'in-stock' | 'out-of-stock' | 'low-stock';
}

interface LoyaltyProgram {
  level: string;
  points: number;
  nextLevelPoints: number;
  benefits: string[];
}

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
    OrdersListComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private orderService = inject(OrderService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

    // Sujet pour gérer la désinscription des observables
    private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  isEditingProfile = false;
  isChangingPassword = false;

  // Données pour les composants
  recentOrders: Order[] = [];

  wishlistItems: Wishlist[] = [
    {
      id: 1,
      name: 'Smartphone Premium XR',
      price: 899.99,
      image: 'assets/images/placeholder.svg',
      availability: 'in-stock'
    },
    {
      id: 2,
      name: 'Casque Audio Bluetooth',
      price: 199.99,
      image: 'assets/images/placeholder.svg',
      availability: 'low-stock'
    },
    {
      id: 3,
      name: 'Tablette Graphique Pro',
      price: 349.99,
      image: 'assets/images/placeholder.svg',
      availability: 'out-of-stock'
    }
  ];

  loyaltyProgram: LoyaltyProgram = {
    level: 'Gold',
    points: 2450,
    nextLevelPoints: 5000,
    benefits: [
      'Livraison gratuite sur toutes les commandes',
      'Retours gratuits sous 30 jours',
      'Accès prioritaire aux ventes privées',
      'Support client prioritaire'
    ]
  };

  constructor() {  }

  ngOnInit() {
     this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9\-\+\s\(\)]+$/)]],
      address: [''],
      city: [''],
      postalCode: ['', [Validators.pattern(/^[0-9]{5}$/)]],
      country: ['France']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });


    this.loadUserProfile();
    this.loadOrders();
  }

  /* unsubscribe from all observables */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserProfile() {
    this.userService.currentUser$
        .pipe(takeUntil(this.destroy$)) // unsubscribe when component is destroyed
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
        },
        error: (error) => {
            console.error('Error loading user profile:', error);
            this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
            });
        }
        });
  }

  loadOrders() {
    this.orderService.getUserOrders()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (orders) => {
        console.log('profile component : Orders loaded:', orders);
        // Convertir les OrderModel en OrderItem pour le composant
        this.recentOrders = orders;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.snackBar.open('Erreur lors du chargement des commandes', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
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

  getAvailabilityIcon(availability: string): string {
    const icons = {
      'in-stock': 'check_circle',
      'low-stock': 'warning',
      'out-of-stock': 'error'
    };
    return icons[availability as keyof typeof icons] || 'help';
  }

  getAvailabilityColor(availability: string): string {
    const colors = {
      'in-stock': 'primary',
      'low-stock': 'warn',
      'out-of-stock': 'warn'
    };
    return colors[availability as keyof typeof colors] || '';
  }

  getLoyaltyProgress(): number {
    return (this.loyaltyProgram.points / this.loyaltyProgram.nextLevelPoints) * 100;
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
    this.userService.updateUser(String(this.currentUser.id), updatedUser)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user) => {
        console.log('Profile updated successfully:', user);
        this.currentUser = user;
        this.isEditingProfile = false;
        this.snackBar.open('Profil mis à jour avec succès', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.snackBar.open('Erreur lors de la mise à jour du profil', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
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
      this.userService.updatePassword(String(this.currentUser.id), changePasswordRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.isChangingPassword = false;
          this.snackBar.open('Mot de passe modifié avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error changing password:', error);
          if(error.status === 400) {
            this.snackBar.open('L\'ancien mot de passe est incorrect.', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          } else {
            this.snackBar.open('Erreur lors du changement de mot de passe', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        }
      });
    }
  }

  removeFromWishlist(itemId: number) {
    this.wishlistItems = this.wishlistItems.filter(item => item.id !== itemId);
    this.snackBar.open('Article retiré de la liste de souhaits', 'Fermer', {
      duration: 2000
    });
  }

  addToCart(item: Wishlist) {
    // Ici vous pourriez appeler le service cart pour ajouter l'article
    console.log('Adding to cart:', item);
    this.snackBar.open(`${item.name} ajouté au panier`, 'Fermer', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  // Méthode pour ouvrir le dialog des détails de commande
  openOrderDetails(orderId: string) {
    const dialogRef = this.dialog.open(OrderDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { orderId },
      panelClass: 'order-details-dialog-container'
    });

    dialogRef.afterClosed()
    // .pipe(takeUntil(this.destroy$))
    .subscribe(result => {
      if (result === 'reorder') {
        //Mettre à jours ke panier
        // this.loadOrders();
      }
    });
  }
}
