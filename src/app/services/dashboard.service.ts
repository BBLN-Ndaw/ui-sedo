import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface DashboardStats {
  dailySales: number;
  totalOrders: number;
  productsInStock: number;
  activeCustomers: number;
  salesChange: number;
  ordersChange: number;
  stockChange: number;
  customersChange: number;
}

export interface RecentActivity {
  id: number;
  type: 'sale' | 'order' | 'stock' | 'customer';
  message: string;
  time: string;
  amount?: number;
  userId?: number;
  userName?: string;
}

export interface LowStockProduct {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
  category: string;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl || 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<DashboardStats> {
    // Pour le moment, retourner des données mock
    // Plus tard, remplacer par: return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
    return of({
      dailySales: 2450,
      totalOrders: 156,
      productsInStock: 1243,
      activeCustomers: 89,
      salesChange: 12,
      ordersChange: 8,
      stockChange: -3,
      customersChange: 15
    });
  }

  getRecentActivities(): Observable<RecentActivity[]> {
    // Mock data - à remplacer par l'API
    return of([
      {
        id: 1,
        type: 'sale',
        message: 'New sale completed',
        time: '2 minutes ago',
        amount: 89.99,
        userId: 1,
        userName: 'John Doe'
      },
      {
        id: 2,
        type: 'order',
        message: 'Order #ORD-2024-001 received',
        time: '15 minutes ago',
        amount: 156.50
      },
      {
        id: 3,
        type: 'stock',
        message: 'Low stock alert: iPhone 15 Pro',
        time: '1 hour ago'
      },
      {
        id: 4,
        type: 'customer',
        message: 'New customer registered: Jane Smith',
        time: '2 hours ago'
      },
      {
        id: 5,
        type: 'sale',
        message: 'Sale completed by Employee #E001',
        time: '3 hours ago',
        amount: 299.99,
        userId: 2,
        userName: 'Employee User'
      }
    ]);
  }

  getLowStockProducts(): Observable<LowStockProduct[]> {
    // Mock data - à remplacer par l'API
    return of([
      {
        id: 1,
        name: 'iPhone 15 Pro',
        currentStock: 3,
        minStock: 10,
        category: 'Smartphones',
        price: 999.99
      },
      {
        id: 2,
        name: 'Samsung Galaxy S24',
        currentStock: 7,
        minStock: 15,
        category: 'Smartphones',
        price: 899.99
      },
      {
        id: 3,
        name: 'MacBook Air M3',
        currentStock: 2,
        minStock: 5,
        category: 'Laptops',
        price: 1299.99
      },
      {
        id: 4,
        name: 'iPad Pro 12.9"',
        currentStock: 5,
        minStock: 8,
        category: 'Tablets',
        price: 1099.99
      }
    ]);
  }

  // Méthodes utilitaires
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getChangeIcon(change: number): string {
    return change >= 0 ? 'trending_up' : 'trending_down';
  }

  getChangeClass(change: number): string {
    return change >= 0 ? 'increase' : 'decrease';
  }

  getStockStatus(current: number, min: number): 'critical' | 'low' | 'ok' {
    const percentage = (current / min) * 100;
    if (percentage <= 30) return 'critical';
    if (percentage <= 60) return 'low';
    return 'ok';
  }

  getStockPercentage(current: number, min: number): number {
    return Math.min((current / min) * 100, 100);
  }
}
