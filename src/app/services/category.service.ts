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

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(`${USER_API_CONFIG.BASE_URL}`, category, { withCredentials: true });
  }

  updateCategory(id: string, category: Category): Observable<Category> {
    return this.http.put<Category>(`${USER_API_CONFIG.BASE_URL}/${id}`, category, { withCredentials: true });
  }

  updateCategoryStatus(id: string, isActive: boolean): Observable<Category> {
    const status = isActive == true ? 'isActive' : 'deactivate';
    const updateStatus = { value: status };
    return this.http.patch<Category>(`${USER_API_CONFIG.BASE_URL}/${id}`, updateStatus, { withCredentials: true });
  }
}
