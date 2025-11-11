import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { Order, OrderStatus, OrderListResponse, OrderFilterOptions } from '../shared/models';
import { ProductService } from './product.service';
import { NotificationService } from './notification.service';

const ORDER_API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/orders',
  ENDPOINTS: {
    CUSTOMER: '/customer',
    UPDATE: '/update',
    CANCEL: '/cancel',
    CREATE: '/create',
    SEARCH: '/search'
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  
  private ordersSubject = new BehaviorSubject<Order[]>([]);

  constructor( private readonly http: HttpClient,
    private readonly productService: ProductService,
    private readonly notificationService: NotificationService,
    
  ) { }

  /**
   * Récupère toutes les commandes de l'utilisateur connecté
  */
  getUserOrders(): Observable<Array<Order>> {
    return this.http.get<Array<Order>>(`${ORDER_API_CONFIG.BASE_URL}${ORDER_API_CONFIG.ENDPOINTS.CUSTOMER}`, {
      withCredentials: true
    });
  }

  getCustomerOrders(customerUserName: String): Observable<Array<Order>> {
    return this.http.get<Array<Order>>(`${ORDER_API_CONFIG.BASE_URL}${ORDER_API_CONFIG.ENDPOINTS.CUSTOMER}/${customerUserName}`, {
      withCredentials: true
    });
  }

  /**
   * Récupère toutes les commandes avec pagination (pour les administrateurs et employés)
   */
  getAllOrdersPaginated(page: number, size: number, filters?: OrderFilterOptions): Observable<OrderListResponse> {
    let params = new HttpParams();
    params = this.addSearchParam(size, page, filters);

    return this.http.get<OrderListResponse>(`${ORDER_API_CONFIG.BASE_URL}${ORDER_API_CONFIG.ENDPOINTS.SEARCH}`, {
      params,
      withCredentials: true
    });
  }

  addSearchParam(size: number, page: number, filters?: OrderFilterOptions): HttpParams {
    let params = new HttpParams()
      .set('size', size.toString())
      .set('page', page.toString());

    if (filters) {
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.period) {
        params = params.set('period', filters.period);
      }
    }

    return params;
  }

  /**
   * Récupère une commande par son ID
  */
  getOrderById(orderId: string): Observable<Order | null> {
     return this.http.get<Order>(`${ORDER_API_CONFIG.BASE_URL}/${orderId}`, {
      withCredentials: true
    });
  }

/**
 * Recommande les articles d'une commande précédente
*/
  reorderItems(orderId: string): Observable<boolean> {
    console.log(`Recommandation des articles de la commande ${orderId}`);
  const order: Order | undefined = this.ordersSubject.getValue().find(o => o.id === orderId);
    console.log('Order found:', order);
  if (order && (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.READY_FOR_PICKUP)) {
    const tasks$ = order.items.map(item =>
      this.productService.orderProductById(item.productId.toString())
    );

    return forkJoin(tasks$).pipe(
      map(results => results.every(r => r === true)) // retourne true si tous réussissent
    );
  }
  console.error('Erreur lors de l\'ajout au panier:');
  this.notificationService.showError('Erreur lors de l\'ajout au panier');
  return of(false);
  }

changeOrderStatus(orderId: string, newStatus: OrderStatus): Observable<Order | null> {
  const newOrderStatus = {orderStatus: newStatus};
  return this.http.patch<Order>(`${ORDER_API_CONFIG.BASE_URL}${ORDER_API_CONFIG.ENDPOINTS.UPDATE}/${orderId}`,
    newOrderStatus, { withCredentials: true });
}

/**
 * Annuler une commande
 */
  cancelOrder(orderId: string): Observable<Order | null> {
    return this.http.put<Order>(`${ORDER_API_CONFIG.BASE_URL}${ORDER_API_CONFIG.ENDPOINTS.CANCEL}/${orderId}`,
      { withCredentials: true }
    );
  }

  updateOrderStatus(orderId: string, status:OrderStatus): Observable<Order | null> {
    return this.changeOrderStatus(orderId, status);
  }

  /**
   * Obtient les statuts de commande disponibles avec leurs informations
   */
  getOrderStatusInfo() {
    return {
      [OrderStatus.PENDING]: {
        label: 'En attente',
        icon: 'schedule',
        color: 'warn',
        description: 'Votre commande est en cours de traitement'
      },
      [OrderStatus.PROCESSING]: {
        label: 'En préparation',
        icon: 'autorenew',
        color: 'accent',
        description: 'Votre commande est en cours de préparation'
      },
      [OrderStatus.SHIPPED]: {
        label: 'Expédiée',
        icon: 'local_shipping',
        color: 'primary',
        description: 'Votre commande a été expédiée'
      },
      [OrderStatus.DELIVERED]: {
        label: 'Livrée',
        icon: 'check_circle',
        color: '',
        description: 'Votre commande a été livrée'
      },
      [OrderStatus.CANCELLED]: {
        label: 'Annulée',
        icon: 'cancel',
        color: 'warn',
        description: 'Votre commande a été annulée'
      },
      [OrderStatus.CONFIRMED]: {
        label: 'Confirmée',
        icon: 'check_circle',
        color: '',
        description: 'Votre commande a été confirmée'
      },
      [OrderStatus.READY_FOR_PICKUP]: {
        label: 'Prête pour le retrait',
        icon: 'check_circle',
        color: '',
        description: 'Votre commande est prête pour le retrait'
      }
    };
  }
}