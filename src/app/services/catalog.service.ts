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
