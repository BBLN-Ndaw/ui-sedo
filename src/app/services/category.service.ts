import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category} from '../shared/models';
import { HttpClient } from '@angular/common/http';


// ===== CONSTANTES =====
const USER_API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/products/categories',
  ENDPOINTS: {
    CATEGORIES: '/categories',
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor( private readonly http: HttpClient,
  ) { }

  getAllCategories(): Observable<Array<Category>> {
     return this.http.get<Array<Category>>(`${USER_API_CONFIG.BASE_URL}`, {
            withCredentials: true
          });
  }  
  getcategoryById(categoryId: string): Observable<Category> {
    return this.http.get<Category>(`${USER_API_CONFIG.BASE_URL}/${categoryId}`, {
      withCredentials: true
    });
  }
}
