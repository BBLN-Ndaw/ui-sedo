import { Component, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { FavoriteItem } from '../shared/models';
import { FavoritesService } from '../services/favorites.service';
import { ProductService } from '../services/product.service';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent implements OnInit, OnDestroy {
  private snackBar = inject(MatSnackBar);
  private favoriteService = inject(FavoritesService);
  private productService = inject(ProductService);
  private destroy$ = new Subject<void>();
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);

  wishlistItems: FavoriteItem[] = [];
  @Input() showCard: boolean = true;

  ngOnInit() {
    this.favoriteService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.wishlistItems = items;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  onRemoveFromWishlist(itemId: number) {
    this.favoriteService.removeFromFavorites(itemId);
    this.snackBar.open('Article retiré de la liste de souhaits', 'Fermer', {
      duration: 2000
    });
  }

  onAddToCart(item: FavoriteItem) {
     this.errorHandlingUtilities.wrapOperation(
      this.productService.orderProductById(String(item.productId)),
      'Ajout au panier'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }
}