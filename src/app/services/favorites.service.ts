import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FavoriteItem } from '../shared/models';



@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly FAVORITES_STORAGE_KEY = 'favorites_list';
  private favoritesSubject = new BehaviorSubject<FavoriteItem[]>(this.loadFavoritesFromStorage());
  public favorites$ = this.favoritesSubject.asObservable();

  addToFavorites(item: FavoriteItem): void {
    const current = this.getCurrentFavorites();
    if (!current.some(fav => fav.productId === item.productId)) {
      const updated = [...current, item];
      this.saveFavoritesToStorage(updated);
      this.favoritesSubject.next(updated);
    }
  }

  removeFromFavorites(itemId: number): void {
    const updated = this.getCurrentFavorites().filter(fav => fav.productId !== itemId);
    this.saveFavoritesToStorage(updated);
    this.favoritesSubject.next(updated);
  }

  isFavorite(itemId: number): boolean {
    return this.getCurrentFavorites().some(fav => fav.productId === itemId);
  }

  getCurrentFavorites(): FavoriteItem[] {
    return this.favoritesSubject.value;
  }

  private saveFavoritesToStorage(favorites: FavoriteItem[]): void {
    try {
      localStorage.setItem(this.FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  }

  private loadFavoritesFromStorage(): FavoriteItem[] {
    try {
      const stored = localStorage.getItem(this.FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      return [];
    }
  }
}
