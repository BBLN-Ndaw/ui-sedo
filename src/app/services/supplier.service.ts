import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Supplier, SupplierFilterOptions, SupplierListResponse } from '../shared/models';

// ===== CONSTANTES =====
const SUPPLIER_API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  ENDPOINTS: {
    SUPPLIERS: '/suppliers',
    STATUS: '/suppliers/status',
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  
  constructor(
    private readonly http: HttpClient,
  ) {}
  

  getSuppliers(
    page: number = 0,
    size: number = 20,
    filters: SupplierFilterOptions = {}
  ): Observable<SupplierListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // Ajouter les filtres de recherche
    params = this.addSearchParam(page, size, filters);

    return this.http.get<SupplierListResponse>(
      `${SUPPLIER_API_CONFIG.BASE_URL}${SUPPLIER_API_CONFIG.ENDPOINTS.SUPPLIERS}`,
      { params: params, withCredentials: true }
    );
  }


  addSearchParam(
    page: number = 0,
    size: number = 20,
    filters: SupplierFilterOptions
  ): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.isActive !== undefined) {
      params = params.set('isActive', filters.isActive.toString());
    }
    if (filters.category) {
      params = params.set('category', filters.category);
    }
    return params;
  }

  getAllSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(
      `${SUPPLIER_API_CONFIG.BASE_URL}${SUPPLIER_API_CONFIG.ENDPOINTS.SUPPLIERS}/all`,
      { withCredentials: true }
    );
  }

  getSupplierById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(
      `${SUPPLIER_API_CONFIG.BASE_URL}${SUPPLIER_API_CONFIG.ENDPOINTS.SUPPLIERS}/${id}`,
      { withCredentials: true }
    );
  }

    createSupplier(createSupplierRequest: Supplier): Observable<Supplier> {
    return this.http.post<Supplier>(
      `${SUPPLIER_API_CONFIG.BASE_URL}${SUPPLIER_API_CONFIG.ENDPOINTS.SUPPLIERS}`,
      createSupplierRequest,
      { withCredentials: true }
    );
  }

  updateSupplierStatus(id: string, action: 'activate' | 'deactivate'): Observable<Supplier> {
    const statusAction = { value: action };
    return this.http.patch<Supplier>(
      `${SUPPLIER_API_CONFIG.BASE_URL}${SUPPLIER_API_CONFIG.ENDPOINTS.SUPPLIERS}/${id}`,
      statusAction,
      { withCredentials: true }
    );
  }


  updateSupplier(supplierId: string, supplier: Supplier): Observable<Supplier> {
    return this.http.put<Supplier>(
      `${SUPPLIER_API_CONFIG.BASE_URL}${SUPPLIER_API_CONFIG.ENDPOINTS.SUPPLIERS}/${supplierId}`,
      supplier,
      { withCredentials: true }
    );
  }

  deleteSupplier(id: string): Observable<Supplier> {
    return this.http.delete<Supplier>(
      `${SUPPLIER_API_CONFIG.BASE_URL}${SUPPLIER_API_CONFIG.ENDPOINTS.SUPPLIERS}/${id}`,
      { withCredentials: true }
    );
  }

  validateSupplierData(supplierData: Supplier): string[] {
    const errors: string[] = [];

    if (!supplierData.name?.trim()) {
      errors.push('Le nom du fournisseur est requis');
    } else if (supplierData.name.length < 2 || supplierData.name.length > 100) {
      errors.push('Le nom du fournisseur doit contenir entre 2 et 100 caractères');
    }

    if (supplierData.contactPersonName && supplierData.contactPersonName.length > 100) {
      errors.push('Le nom de la personne de contact ne doit pas dépasser 100 caractères');
    }

    if (supplierData.category && supplierData.category.length > 50) {
      errors.push('La catégorie ne doit pas dépasser 50 caractères');
    }

    // Email est maintenant obligatoire
    if (!supplierData.email?.trim()) {
      errors.push('L\'email est requis');
    } else if (!this.isValidEmail(supplierData.email)) {
      errors.push('L\'email n\'est pas valide');
    }

    // Phone est maintenant obligatoire
    if (!supplierData.phone?.trim()) {
      errors.push('Le numéro de téléphone est requis');
    } else if (supplierData.phone.length > 20) {
      errors.push('Le numéro de téléphone ne doit pas dépasser 20 caractères');
    }

    // Address est maintenant obligatoire
    if (!supplierData.address) {
      errors.push('L\'adresse est requise');
    } else {
      if (!supplierData.address.street?.trim()) {
        errors.push('La rue est requise');
      }
      if (!supplierData.address.city?.trim()) {
        errors.push('La ville est requise');
      }
      if (!supplierData.address.postalCode?.trim()) {
        errors.push('Le code postal est requis');
      }
      if (!supplierData.address.country?.trim()) {
        errors.push('Le pays est requis');
      }
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}