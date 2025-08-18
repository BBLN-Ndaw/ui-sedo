import { Component, OnInit, inject } from '@angular/core';
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
import { OrderService, Order as OrderModel } from '../../services/order.service';
import { User } from '../../shared/models';
import { OrderDetailsDialogComponent } from '../../shared/components/order-details-dialog/order-details-dialog.component';

interface Order {
  id: string;
  date: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: number;
}

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
    MatDialogModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private orderService = inject(OrderService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  currentUser: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isEditingProfile = false;
  isChangingPassword = false;

  // Données de démonstration pour la wishlist
  recentOrders: Order[] = [];

  wishlistItems: Wishlist[] = [
    {
      id: 1,
      name: 'Smartphone Premium XR',
      price: 899.99,
      image: 'assets/images/phone.jpg',
      availability: 'in-stock'
    },
    {
      id: 2,
      name: 'Casque Audio Bluetooth',
      price: 199.99,
      image: 'assets/images/headphones.jpg',
      availability: 'low-stock'
    },
    {
      id: 3,
      name: 'Tablette Graphique Pro',
      price: 349.99,
      image: 'assets/images/tablet.jpg',
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

  constructor() {
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
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadOrders();
  }

  loadUserProfile() {
    this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });
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
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        // Convertir les OrderModel en Order (interface locale simplifiée)
        this.recentOrders = orders.map(order => ({
          id: order.id,
          date: order.date,
          status: order.status,
          total: order.total,
          items: order.itemCount
        }));
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

  getOrderStatusIcon(status: string): string {
    const icons = {
      'pending': 'schedule',
      'processing': 'autorenew',
      'shipped': 'local_shipping',
      'delivered': 'check_circle',
      'cancelled': 'cancel'
    };
    return icons[status as keyof typeof icons] || 'help';
  }

  getOrderStatusColor(status: string): string {
    const colors = {
      'pending': 'warn',
      'processing': 'accent',
      'shipped': 'primary',
      'delivered': '',
      'cancelled': 'warn'
    };
    return colors[status as keyof typeof colors] || '';
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
    if (this.profileForm.valid) {
      // Ici vous pourriez appeler un service pour sauvegarder les données
      console.log('Saving profile:', this.profileForm.value);
      this.isEditingProfile = false;
      this.snackBar.open('Profil mis à jour avec succès', 'Fermer', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  onCancelEdit() {
    this.isEditingProfile = false;
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email
      });
    }
  }

  onChangePassword() {
    if (this.passwordForm.valid) {
      // Ici vous pourriez appeler un service pour changer le mot de passe
      console.log('Changing password');
      this.passwordForm.reset();
      this.isChangingPassword = false;
      this.snackBar.open('Mot de passe modifié avec succès', 'Fermer', {
        duration: 3000,
        panelClass: ['success-snackbar']
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

  // Nouvelle méthode pour ouvrir le dialog des détails de commande
  openOrderDetails(orderId: string) {
    const dialogRef = this.dialog.open(OrderDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { orderId },
      panelClass: 'order-details-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'reorder') {
        // Optionnel: actualiser les données si nécessaire
        this.loadOrders();
      }
    });
  }

  // Méthode pour annuler une commande
  cancelOrder(orderId: string, event: Event) {
    event.stopPropagation(); // Empêcher l'ouverture du dialog
    
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: (success) => {
          if (success) {
            this.snackBar.open('Commande annulée avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadOrders(); // Recharger les commandes
          } else {
            this.snackBar.open('Impossible d\'annuler cette commande', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
          this.snackBar.open('Erreur lors de l\'annulation', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  // Méthode pour reommander
  reorderItems(orderId: string, event: Event) {
    event.stopPropagation(); // Empêcher l'ouverture du dialog
    
    this.orderService.reorderItems(orderId).subscribe({
      next: (success) => {
        if (success) {
          this.snackBar.open('Articles ajoutés au panier', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.snackBar.open('Erreur lors de l\'ajout au panier', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Error reordering:', error);
        this.snackBar.open('Erreur lors de la reommande', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
