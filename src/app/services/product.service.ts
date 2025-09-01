import { Injectable } from "@angular/core";
import { catchError, map, Observable, of, switchMap, takeUntil, tap } from "rxjs";
import { ProductWithCategoryDto } from "../shared/models";
import { NotificationService } from "./notification.service";
import { FormatUtilities } from "./format.utilities";
import { StockUtilities } from "./stock.utilities";
import { PromotionUtilities } from "./promotion.utilities";
import { CartService } from "./cart.service";
import { HttpClient } from "@angular/common/http";

// ===== CONSTANTES =====
const USER_API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/products',
  ENDPOINTS: {
    CATALOG: '/catalog',
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
     private readonly notificationService: NotificationService,
     private readonly http: HttpClient,
     private readonly formatUtilities: FormatUtilities,
     private readonly stockUtilities: StockUtilities,
     private readonly promotionUtilities: PromotionUtilities,
     private readonly cartService: CartService
    ) { }


    getProductWithCategoryById(productId: string): Observable<ProductWithCategoryDto> {
      return this.http.get<ProductWithCategoryDto>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.CATALOG}/${productId}`, {
        withCredentials: true
      });
    }

    getAllProductWithCategory(): Observable<Array<ProductWithCategoryDto>> {
      return this.http.get<Array<ProductWithCategoryDto>>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.CATALOG}`, {
        withCredentials: true
      });
    } 

  /**
   * Ajoute un produit au panier avec validation de stock
   */
  orderProduct(product: ProductWithCategoryDto): Observable<boolean> {
    if (this.getStockStatus(product) === 'out-of-stock') {
      this.notificationService.showWarning('Ce produit n\'est plus disponible en stock');
      return of(false);
    }

    const currentQuantityInCart = this.cartService.getProductQuantityInCart(product.id);
    if (currentQuantityInCart >= product.stockQuantity) {
      this.notificationService.showWarning('Quantité maximale déjà atteinte pour ce produit');
      return of(false);
    }

    return this.cartService.addToCart(product, 1).pipe(
      map((cart) => {
        const totalQuantity = this.cartService.getProductQuantityInCart(product.id);
        this.notificationService.showSuccess(
          `${product.name} ajouté au panier (${totalQuantity})`
        );
        console.log('Produit ajouté au panier:', { product, cart });
        return true;
      }),
      catchError((error) => {
        console.error('Erreur lors de l\'ajout au panier:', error);
        this.notificationService.showError(error.message || 'Erreur lors de l\'ajout au panier');
        return of(false);
      })
    );
  }

  /**
   * Ajoute un produit au panier par son ID
   */
  orderProductById(productId: string): Observable<boolean> {
    return this.getProductWithCategoryById(productId).pipe(
      switchMap((product) => this.orderProduct(product))
    );
  } 

  getStockStatus(product: ProductWithCategoryDto): 'in-stock' | 'low-stock' | 'out-of-stock' {
    return this.stockUtilities.getStockStatus(product);
  }

  getStockStatusText(product: ProductWithCategoryDto): string {
    return this.stockUtilities.getStockStatusText(product);
  }

  getStockStatusIcon(product: ProductWithCategoryDto): string {
    return this.stockUtilities.getStockStatusIcon(product);
  }

  formatCurrency(price: number): string {
    return this.formatUtilities.formatCurrency(price);
  }

  /**
   * Calcule le prix TTC à partir du prix HT et du taux de TVA
   */
  calculatePriceTTC(priceHT: number, taxRate: number): number {
    return this.promotionUtilities.calculatePriceTTC(priceHT, taxRate);
  }

  /**
   * Calcule le montant de TVA
   */
  calculateTaxAmount(priceHT: number, taxRate: number): number {
    return priceHT * taxRate;
  }

  /**
   * Obtient le prix TTC d'un produit (normal ou promotionnel)
   */
  getProductPriceTTC(product: ProductWithCategoryDto): number {
    return this.promotionUtilities.getApplicablePriceTTC(product);
  }

  /**
   * Formate le prix TTC d'un produit
   */
  formatProductPriceTTC(product: ProductWithCategoryDto): string {
    return this.promotionUtilities.formatApplicablePriceTTC(product);
  }

  /**
   * Obtient le prix HT effectif (normal ou promotionnel)
   */
  getEffectivePriceHT(product: ProductWithCategoryDto): number {
    return this.promotionUtilities.getApplicablePriceHT(product);
  }
   
}