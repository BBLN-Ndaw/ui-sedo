import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ProductService } from './product.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Product, Supplier, User } from '../shared/models';
import { NotificationService } from './notification.service';


// ===== CONSTANTES =====
const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  ENDPOINTS: {
    PRODUCT: '/products/all',
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class ExportToExcelService {
  constructor(
    private notificationService: NotificationService
  ) { }

  exportProductToExcel(products: Product[]) {
    // Aplatir les données pour que les images soient lisibles dans Excel
    const flattenedData = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      minStock: product.minStock,
      unit: product.unit,
      expirationDate: product.expirationDate,
      imageUrls: product.imageUrls?.join(', ') || '',
      isActive: product.isActive,
      isOnPromotion: product.isOnPromotion,
      promotionPrice: product.promotionPrice || '',
      promotionEndDate: product.promotionEndDate
    }));

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // to download the file on browser side
    saveAs(blob, 'products.xlsx');
    this.notificationService.showSuccess('Export des produits réussi.');

  }

  exportUserDataToExcel(usersData: User[]) {
    // Aplatir les données pour que l'adresse et les rôles soient lisibles dans Excel
    const flattenedData = usersData.map(user => ({
      id: user.id,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      street: user.address?.street || '',
      city: user.address?.city || '',
      postalCode: user.address?.postalCode || '',
      country: user.address?.country || '',
      numTel: user.numTel,
      isActive: user.isActive,
      roles: user.roles?.join(', ') || '',
      createdAt: user.createdAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(blob, 'clients.xlsx');
    this.notificationService.showSuccess('Export des clients réussi.');

  }

  exportSupplierDataToExcel(supplierData: Supplier[]) {
    // Aplatir les données pour que l'adresse soit lisible dans Excel
    const flattenedData = supplierData.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      contactPersonName: supplier.contactPersonName || '',
      category: supplier.category || '',
      email: supplier.email,
      phone: supplier.phone,
      street: supplier.address?.street || '',
      city: supplier.address?.city || '',
      postalCode: supplier.address?.postalCode || '',
      country: supplier.address?.country || '',
      isActive: supplier.isActive
    }));

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, 'suppliers.xlsx');
    this.notificationService.showSuccess('Export des fournisseurs réussi.');
  }

}