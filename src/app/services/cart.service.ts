import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Cart, 
  CartItem, 
  CartSummary,
  ProductWithCategoryDto 
} from '../shared/models';
import { PromotionUtilities } from './promotion.utilities';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_STORAGE_KEY = 'shopping_cart';
  
  // État du panier avec BehaviorSubject pour la réactivité
  private cartSubject = new BehaviorSubject<Cart>(this.loadCartFromStorage());
  
  // Observables publics
  public cart$ = this.cartSubject.asObservable();
  public cartSummary$: Observable<CartSummary> = this.cart$.pipe(
    map(cart => ({
      itemCount: cart.itemCount,
      totalTTC: this.calculateCartTotalTTC(cart)
    }))
  );

  private promotionUtilities = inject(PromotionUtilities);

  /**
   * Obtient le panier actuel
   */
  getCurrentCart(): Cart {
    return this.cartSubject.value;
  }

  /**
   * Calcule le prix TTC d'un item
   */
  calculateItemPriceTTC(item: CartItem): number {
    return item.productUnitPriceHT * (1 + item.productTaxRate);
  }

  /**
   * Calcule le total HT d'un item
   */
  calculateItemTotalHT(item: CartItem): number {
    return item.quantity * item.productUnitPriceHT;
  }

  /**
   * Calcule le total TTC d'un item
   */
  calculateItemTotalTTC(item: CartItem): number {
    return item.quantity * this.calculateItemPriceTTC(item);
  }

  /**
   * Calcule le montant de TVA d'un item
   */
  calculateItemTaxAmount(item: CartItem): number {
    return this.calculateItemTotalTTC(item) - this.calculateItemTotalHT(item);
  }

  /**
   * Calcule le sous-total HT du panier
   */
  calculateCartSubTotalHT(cart: Cart): number {
    return cart.items.reduce((total, item) => total + this.calculateItemTotalHT(item), 0);
  }

  /**
   * Calcule le total des taxes du panier
   */
  calculateCartTotalTax(cart: Cart): number {
    return cart.items.reduce((total, item) => total + this.calculateItemTaxAmount(item), 0);
  }

  /**
   * Calcule le total TTC du panier
   */
  calculateCartTotalTTC(cart: Cart): number {
    return this.calculateCartSubTotalHT(cart) + this.calculateCartTotalTax(cart) - cart.discount;
  }

  /**
   * Ajoute un produit au panier
   */
  addToCart(product: ProductWithCategoryDto, quantity: number = 1): Observable<Cart> {
    const currentCart = this.getCurrentCart();
    const existingItemIndex = currentCart.items.findIndex(
      item => item.productId === product.id
    );

    if (existingItemIndex >= 0) {
      // Le produit existe déjà, on met à jour la quantité
      const existingItem = currentCart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity <= product.stockQuantity) {
        existingItem.quantity = newQuantity;
      } else {
        throw new Error(`Quantité demandée (${newQuantity}) supérieure au stock disponible (${product.stockQuantity})`);
      }
    } else {
      // Nouveau produit
      if (quantity <= product.stockQuantity) {
        const priceHT = this.promotionUtilities.isValidPromotion(product) ? product.promotionPrice! : product.sellingPrice;
        
        const newCartItem: CartItem = {
          id: this.generateCartItemId(),
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          productUnitPriceHT: priceHT,
          productTaxRate: product.taxRate,
          quantity: quantity,
          productMaxQuantity: product.stockQuantity,
          imageUrl: product.imageUrls[0],
          categoryName: product.category.name
        };
        
        currentCart.items.push(newCartItem);
      } else {
        throw new Error(`Quantité demandée (${quantity}) supérieure au stock disponible (${product.stockQuantity})`);
      }
    }

    // Recalculer les totaux et sauvegarder
    this.recalculateCart(currentCart);
    this.saveCartToStorage(currentCart);
    this.cartSubject.next(currentCart);
    
    return this.cart$;
  }

  /**
   * Met à jour la quantité d'un article dans le panier
   */
  updateCartItem(cartItemId: string, quantity: number): Observable<Cart> {
    const currentCart = this.getCurrentCart();
    const itemIndex = currentCart.items.findIndex(item => item.id === cartItemId);
    
    if (itemIndex >= 0) {
      const item = currentCart.items[itemIndex];
      
      if (quantity <= 0) {
        // Supprimer l'article si quantité <= 0
        currentCart.items.splice(itemIndex, 1);
      } else if (quantity <= item.productMaxQuantity) {
        // Mettre à jour la quantité
        item.quantity = quantity;
      } else {
        throw new Error(`Quantité demandée (${quantity}) supérieure au stock disponible (${item.productMaxQuantity})`);
      }
      
      this.recalculateCart(currentCart);
      this.saveCartToStorage(currentCart);
      this.cartSubject.next(currentCart);
    }
    
    return this.cart$;
  }

  /**
   * Supprime un article du panier
   */
  removeFromCart(cartItemId: string): Observable<Cart> {
    const currentCart = this.getCurrentCart();
    const itemIndex = currentCart.items.findIndex(item => item.id === cartItemId);
    
    if (itemIndex >= 0) {
      currentCart.items.splice(itemIndex, 1);
      this.recalculateCart(currentCart);
      this.saveCartToStorage(currentCart);
      this.cartSubject.next(currentCart);
    }
    
    return this.cart$;
  }

  /**
   * Vide complètement le panier
   */
  clearCart(): Observable<Cart> {
    const emptyCart = this.initializeCart();
    this.saveCartToStorage(emptyCart);
    this.cartSubject.next(emptyCart);
    return this.cart$;
  }

  /**
   * Vérifie si un produit est dans le panier
   */
  isProductInCart(productId: number): boolean {
    const currentCart = this.getCurrentCart();
    return currentCart.items.some(item => item.productId === productId);
  }

  /**
   * Obtient la quantité d'un produit dans le panier
   */
  getProductQuantityInCart(productId: number): number {
    const currentCart = this.getCurrentCart();
    const item = currentCart.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  }

  /**
   * Initialise un panier vide
   */
  private initializeCart(): Cart {
    return {
      id: this.generateCartId(),
      items: [],
      itemCount: 0,
      discount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Recalcule tous les totaux du panier (seul itemCount a besoin d'être mis à jour)
   */
  private recalculateCart(cart: Cart): void {
    cart.itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.updatedAt = new Date();
  }

  /**
   * Sauvegarde le panier dans le localStorage
   */
  private saveCartToStorage(cart: Cart): void {
    try {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  }

  /**
   * Charge le panier depuis le localStorage
   */
  private loadCartFromStorage(): Cart {
    try {
      const storedCart = localStorage.getItem(this.CART_STORAGE_KEY);
      if (storedCart) {
        const cart: Cart = JSON.parse(storedCart);
        // Reconvertir les dates
        cart.updatedAt = new Date(cart.updatedAt);
        return cart;
      }
      return this.initializeCart();
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
      // En cas d'erreur, initialiser un panier vide
      return this.initializeCart();
    }
  }

  /**
   * Génère un ID unique pour le panier
   */
  private generateCartId(): string {
    return 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Génère un ID unique pour un article du panier
   */
  private generateCartItemId(): string {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Formate un prix en euros
   */
  formatCurrency(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }
}
