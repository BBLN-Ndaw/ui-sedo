import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Product, ProductCategory, ProductWithCategoryDto } from '../shared/models';
import { HttpClient, HttpHeaders } from '@angular/common/http';



// ===== CONSTANTES =====
const USER_API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  ENDPOINTS: {
    CATALOG: '/catalog',
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  constructor( private readonly http: HttpClient,) { }

   getProductWithCategory(): Observable<Array<ProductWithCategoryDto>> {
      return this.http.get<Array<ProductWithCategoryDto>>(`${USER_API_CONFIG.BASE_URL}${USER_API_CONFIG.ENDPOINTS.CATALOG}`, {
        withCredentials: true
      });
    }

  getAllProducts(): Observable<Product[]> {
    const mockProducts: Product[] = [
      {
        id: 1,
        name: 'Smartphone Premium X1',
        description: 'Smartphone haut de gamme avec écran OLED 6.5" et triple caméra 108MP',
        sku: 'PHONE-X1-001',
        barcode: '1234567890123',
        category: { id: 1, name: 'Électronique', description: 'Appareils électroniques', isActive: true },
        price: 899.99,
        costPrice: 650.00,
        stock: 25,
        minStock: 5,
        maxStock: 50,
        unit: 'pièce',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'],
        isActive: true,
        isOnPromotion: true,
        promotionPrice: 699.99,
        promotionEndDate: new Date('2025-08-20'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-01')
      },
      {
        id: 2,
        name: 'Ordinateur Portable Gaming',
        description: 'PC portable gaming avec RTX 4070, Intel i7 et 16GB RAM',
        sku: 'LAPTOP-GAM-002',
        category: { id: 1, name: 'Électronique', description: 'Appareils électroniques', isActive: true },
        price: 1299.99,
        costPrice: 950.00,
        stock: 12,
        minStock: 3,
        maxStock: 20,
        unit: 'pièce',
        images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'],
        isActive: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-02-05')
      },
      {
        id: 3,
        name: 'Casque Audio Bluetooth',
        description: 'Casque sans fil avec réduction de bruit active et autonomie 30h',
        sku: 'AUDIO-BT-003',
        category: { id: 2, name: 'Audio', description: 'Équipements audio', isActive: true },
        price: 249.99,
        costPrice: 180.00,
        stock: 45,
        minStock: 10,
        maxStock: 60,
        unit: 'pièce',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
        isActive: true,
        isOnPromotion: true,
        promotionPrice: 179.99,
        promotionEndDate: new Date('2025-08-16'),
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-02-10')
      },
      {
        id: 4,
        name: 'Montre Connectée Sport',
        description: 'Montre connectée étanche avec GPS et suivi de santé avancé',
        sku: 'WATCH-SPT-004',
        category: { id: 3, name: 'Wearables', description: 'Objets connectés portables', isActive: true },
        price: 329.99,
        costPrice: 240.00,
        stock: 18,
        minStock: 5,
        maxStock: 30,
        unit: 'pièce',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
        isActive: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: 5,
        name: 'Tablette Graphique Pro',
        description: 'Tablette professionnelle pour designers avec stylet sensible à la pression',
        sku: 'TAB-GRAPH-005',
        category: { id: 1, name: 'Électronique', description: 'Appareils électroniques', isActive: true },
        price: 449.99,
        costPrice: 320.00,
        stock: 8,
        minStock: 2,
        maxStock: 15,
        unit: 'pièce',
        images: ['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400'],
        isActive: true,
        isOnPromotion: true,
        promotionPrice: 329.99,
        promotionEndDate: new Date('2025-08-25'),
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-20')
      },
      {
        id: 6,
        name: 'Caméra Action 4K',
        description: 'Caméra d\'action ultra-compacte 4K 60fps avec stabilisation',
        sku: 'CAM-ACT-006',
        category: { id: 4, name: 'Photo/Vidéo', description: 'Équipements photo et vidéo', isActive: true },
        price: 199.99,
        costPrice: 140.00,
        stock: 32,
        minStock: 8,
        maxStock: 40,
        unit: 'pièce',
        images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400'],
        isActive: true,
        isOnPromotion: true,
        promotionPrice: 149.99,
        promotionEndDate: new Date('2025-08-18'),
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-25')
      }
    ];

    return of(mockProducts).pipe(delay(300));
  }

  getCategories(): Observable<ProductCategory[]> {

    const mockCategories: ProductCategory[] = [
      { id: 1, name: 'Électronique', description: 'Appareils électroniques', isActive: true },
      { id: 2, name: 'Audio', description: 'Équipements audio', isActive: true },
      { id: 3, name: 'Wearables', description: 'Objets connectés portables', isActive: true },
      { id: 4, name: 'Photo/Vidéo', description: 'Équipements photo et vidéo', isActive: true }
    ];

    return of(mockCategories).pipe(delay(200));
  }

  formatCurrency(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  
}
