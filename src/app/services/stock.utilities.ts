import { Injectable } from '@angular/core';
import { ProductWithCategoryDto } from '../shared/models';

@Injectable({
  providedIn: 'root'
})
export class StockUtilities {

  /**
   * Détermine le statut du stock d'un produit
   */
  getStockStatus(product: ProductWithCategoryDto): 'in-stock' | 'low-stock' | 'out-of-stock' {
    if (product.stockQuantity === 0) return 'out-of-stock';
    if (product.stockQuantity <= 5) return 'low-stock';
    return 'in-stock';
  }

  /**
   * Obtient le texte descriptif du statut du stock
   */
  getStockStatusText(product: ProductWithCategoryDto): string {
    switch (this.getStockStatus(product)) {
      case 'in-stock': return 'En stock';
      case 'low-stock': return 'Stock limité';
      case 'out-of-stock': return 'Rupture de stock';
      default: return 'Statut inconnu';
    }
  }

  /**
   * Obtient l'icône correspondant au statut du stock
   */
  getStockStatusIcon(product: ProductWithCategoryDto): string {
    switch (this.getStockStatus(product)) {
      case 'in-stock': return 'check_circle';
      case 'low-stock': return 'warning';
      case 'out-of-stock': return 'error';
      default: return 'help';
    }
  }

  /**
   * Vérifie si un produit est disponible à l'achat
   */
  isAvailableForPurchase(product: ProductWithCategoryDto): boolean {
    return this.getStockStatus(product) !== 'out-of-stock';
  }

  /**
   * Obtient le nombre de produits en stock
   */
  getInStockCount(products: ProductWithCategoryDto[]): number {
    return products.filter(product => this.getStockStatus(product) === 'in-stock').length;
  }

  /**
   * Filtre les produits en stock
   */
  filterInStockProducts(products: ProductWithCategoryDto[]): ProductWithCategoryDto[] {
    return products.filter(product => this.getStockStatus(product) === 'in-stock');
  }

  /**
   * Filtre les produits avec stock limité
   */
  filterLowStockProducts(products: ProductWithCategoryDto[]): ProductWithCategoryDto[] {
    return products.filter(product => this.getStockStatus(product) === 'low-stock');
  }

  /**
   * Filtre les produits en rupture de stock
   */
  filterOutOfStockProducts(products: ProductWithCategoryDto[]): ProductWithCategoryDto[] {
    return products.filter(product => this.getStockStatus(product) === 'out-of-stock');
  }
}
