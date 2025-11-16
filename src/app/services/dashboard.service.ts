import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Product, TopSellingProductDto } from '../shared/models';

export interface DashboardStats {
  dailySales: number;
  processingOrders: number;
  productsInStock: number;
  monthlyRevenue: number;
  revenuePerMonthInCurrentYear: Map<string, number>;
  averageOrderValue: number;
  monthlyCancelledOrders: number;
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


@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private ordersApiUrl = 'http://localhost:8080/api/orders/analytics';
  private productsApiUrl = 'http://localhost:8080/api/products';
  private apiDashboardUrl = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) { }

  getTopSellingProducts(limit: number): Observable<TopSellingProductDto[]> {
     let params = new HttpParams()
      .set('limit', limit.toString());
    return this.http.get<TopSellingProductDto[]>(`${this.ordersApiUrl}/top-selling`, {
      withCredentials: true,
      params: params
    });
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiDashboardUrl}/statistics`, { 
       withCredentials: true });
  }

  getRecentActivities(): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiDashboardUrl}/notifications`, { withCredentials: true });
  }

  getLowStockProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.productsApiUrl}/low-stock`, { withCredentials: true });
  }

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
