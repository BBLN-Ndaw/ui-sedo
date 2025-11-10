import { Injectable } from "@angular/core";
import { catchError, map, Observable, of, switchMap} from "rxjs";
import { ProductWithCategoryDto, Product, ProductWithCategoryListResponse, ProductFilterOptions } from "../shared/models";
import { NotificationService } from "./notification.service";
import { StockUtilities } from "./stock.utilities";
import { CartService } from "./cart.service";
import { HttpClient, HttpParams } from "@angular/common/http";

// ===== CONSTANTES =====
const USER_API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/products',
  ENDPOINTS: {
    PRODUCT_WITH_CATEGORY:'product-with-category'
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
     private readonly notificationService: NotificationService,
     private readonly http: HttpClient,
     private readonly stockUtilities: StockUtilities,
     private readonly cartService: CartService
    ) { }


    getProductWithCategoryById(productId: string): Observable<ProductWithCategoryDto> {
      return this.http.get<ProductWithCategoryDto>(`${USER_API_CONFIG.BASE_URL}/${USER_API_CONFIG.ENDPOINTS.PRODUCT_WITH_CATEGORY}/${productId}`, {
        withCredentials: true
      });
    }

    getAllProductWithCategory(): Observable<Array<ProductWithCategoryDto>> {
      return this.http.get<Array<ProductWithCategoryDto>>(`${USER_API_CONFIG.BASE_URL}/${USER_API_CONFIG.ENDPOINTS.PRODUCT_WITH_CATEGORY}/all`, {
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
    return this.stockUtilities.getStockStatus(product);
  }


  getProductsWithCategory(page: number = 0, size: number = 50, filters?: ProductFilterOptions): Observable<ProductWithCategoryListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    params = this.addSearchParam(size, page, filters || {});
     return this.http.get<ProductWithCategoryListResponse>(`${USER_API_CONFIG.BASE_URL}`, {
        params: params, withCredentials: true
      });
  }

  addSearchParam(size: number, page: number, filters: ProductFilterOptions): HttpParams {
    let params = new HttpParams()
      .set('size', size.toString())
      .set('page', page.toString());

      if (filters) {
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.categoryId) {
        params = params.set('categoryId', filters.categoryId);
      }
      if (filters.supplierId) {
        params = params.set('supplierId', filters.supplierId);
      }
      if (filters.isActive !== undefined) {
        params = params.set('isActive', filters.isActive.toString());
      }
      if (filters.isOnPromotion !== undefined) {
        params = params.set('isOnPromotion', filters.isOnPromotion.toString());
      }
      if (filters.minPrice !== undefined) {
        params = params.set('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined) {
        params = params.set('maxPrice', filters.maxPrice.toString());
      }
      if (filters.isLowStock !== undefined) {
        params = params.set('isLowStock', filters.isLowStock.toString());
      }
      if (filters.isInStock !== undefined) {
        params = params.set('isInStock', filters.isInStock.toString());
      }
      if (filters.isOutOfStock !== undefined) {
        params = params.set('isOutOfStock', filters.isOutOfStock.toString());
      }
    }
    return params;
  }


  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${USER_API_CONFIG.BASE_URL}/all`, {
      withCredentials: true
    })
  }

  createProduct(productData: Product): Observable<Product | null> {
    return this.http.post<Product>(`${USER_API_CONFIG.BASE_URL}`, productData, {
      withCredentials: true
    });
  }


  updateProduct(productData: Product): Observable<Product | null> {
    return this.http.put<Product>(`${USER_API_CONFIG.BASE_URL}/${productData.id}`, productData, {
      withCredentials: true
    });
  }

  toggleProductStatus(productId: string, action: 'activate' | 'deactivate'): Observable<Product> {
    const statusAction = {value: action};
    return this.http.put<Product>(`${USER_API_CONFIG.BASE_URL}/status/${productId}`, 
     statusAction, { withCredentials: true }
    );
  }


  updateProductStock(productId: string, stockQuantity: number): Observable<Product> {
    return this.http.patch<Product>(`${USER_API_CONFIG.BASE_URL}/${productId}/stock`, 
      { stockQuantity }, 
      { withCredentials: true }
    );
  }

  validateProductData(productData: Product): string[] {
    const errors: string[] = [];

    if (!productData.name?.trim()) {
      errors.push('Le nom du produit est requis');
    }

    if (!productData.sku?.trim()) {
      errors.push('Le SKU est requis');
    }

    if (!productData.categoryId?.trim()) {
      errors.push('La catégorie est requise');
    }

    if (!productData.supplierId?.trim()) {
      errors.push('Le fournisseur est requis');
    }

    if (!productData.sellingPrice || productData.sellingPrice <= 0) {
      errors.push('Le prix de vente doit être supérieur à 0');
    }

    if (!productData.purchasePrice || productData.purchasePrice <= 0) {
      errors.push('Le prix d\'achat doit être supérieur à 0');
    }

    if (productData.stockQuantity !== undefined && productData.stockQuantity < 0) {
      errors.push('La quantité en stock ne peut pas être négative');
    }

    if (productData.minStock !== undefined && productData.minStock < 0) {
      errors.push('Le stock minimum ne peut pas être négatif');
    }

    if (!productData.unit?.trim()) {
      errors.push('L\'unité est requise');
    }

    if (productData.taxRate !== undefined && (productData.taxRate < 0 || productData.taxRate > 1)) {
      errors.push('Le taux de TVA doit être entre 0 et 1 (ex: 0.20 pour 20%)');
    }

    if (productData.isOnPromotion && productData.promotionPrice && productData.sellingPrice && 
        productData.promotionPrice >= productData.sellingPrice) {
      errors.push('Le prix promotionnel doit être inférieur au prix de vente');
    }

    return errors;
  }


  uploadProductImages(productName: string, files: File[]): Observable<string[]> {
    productName = productName.trim().replace(/\s+/g, "_").toLowerCase();
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('images', file);
    });
    return this.http.post<string[]>(
      `${USER_API_CONFIG.BASE_URL}/images/${encodeURIComponent(productName)}`,
      formData, {withCredentials: true}
    );
  }

  deleteProductImages(imageUrls: string[]): Observable<Product> {
    return this.http.delete<Product>(`${USER_API_CONFIG.BASE_URL}/images`, {
      body: { imageUrls },
      withCredentials: true
    });
  }

    deleteProduct(productId: string): Observable<Product> {
    return this.http.delete<Product>(`${USER_API_CONFIG.BASE_URL}/${productId}`, {
      withCredentials: true
    });
  }

}