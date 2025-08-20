import { Injectable } from "@angular/core";
import { catchError, map, Observable, of, switchMap, takeUntil, tap } from "rxjs";
import { ProductWithCategoryDto } from "../shared/models";
import { CartService } from "./cart.service";
import { NotificationService } from "./notification.service";
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
  constructor(private readonly cartService: CartService,
     private readonly notificationService: NotificationService,
     private readonly http: HttpClient
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

  orderProductById(productId: string): Observable<boolean> {
  return this.getProductWithCategoryById(productId).pipe(
    switchMap((product) => this.orderProduct(product))
  );
}


  getStockStatus(product: ProductWithCategoryDto): 'in-stock' | 'low-stock' | 'out-of-stock' {
    if (product.stockQuantity === 0) return 'out-of-stock';
    if (product.stockQuantity <= 5) return 'low-stock';
    return 'in-stock';
  }

  getStockStatusText(product: ProductWithCategoryDto): string {
    const status = this.getStockStatus(product);
    switch (status) {
      case 'out-of-stock': return 'Rupture de stock';
      case 'low-stock': return 'Stock faible';
      case 'in-stock': return 'En stock';
      default: return 'En stock';
    }
  }

  getStockStatusIcon(product: ProductWithCategoryDto): string {
    const status = this.getStockStatus(product);
    switch (status) {
      case 'out-of-stock': return 'block';
      case 'low-stock': return 'warning';
      case 'in-stock': return 'check_circle';
      default: return 'check_circle';
    }
  }

  formatCurrency(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

   
}