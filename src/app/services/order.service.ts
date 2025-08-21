import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { Order, OrderStatus } from '../shared/models';
import { ProductService } from './product.service';
import { NotificationService } from './notification.service';

const ORDER_API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/orders',
  ENDPOINTS: {
    CUSTOMER: '/customer',
    UPDATE: '/update',
    CANCEL: '/cancel'
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  orders$ = this.ordersSubject.asObservable();

  constructor( private readonly http: HttpClient,
    private readonly productService: ProductService,
    private readonly notificationService: NotificationService,
    
  ) { }

  /**
   * Récupère toutes les commandes de l'utilisateur
  */
  getUserOrders(): Observable<Array<Order>> {
    const orders = this.ordersSubject.getValue();
    if (orders.length > 0) {
      return of(orders);
    }
    return this.http.get<Array<Order>>(`${ORDER_API_CONFIG.BASE_URL}${ORDER_API_CONFIG.ENDPOINTS.CUSTOMER}`, {
      withCredentials: true
    }).pipe(
      tap(orders => this.ordersSubject.next(orders))
      );
  }

  /**
   * Récupère une commande par son ID
  */
  getOrderById(orderId: string): Observable<Order | null> {
    const orders = this.ordersSubject.getValue();
    const localOrder = orders.find(order => order.id === orderId);

  if (localOrder) {
    return of(localOrder); 
  }
  else{
     return this.http.get<Order>(`${ORDER_API_CONFIG.BASE_URL}/${orderId}`, {
      withCredentials: true
    });
  }
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
  console.log(`Changement du statut de la commande ${orderId} vers ${newStatus}`);

  const orders = this.ordersSubject.getValue();

  const updatedOrders = orders.map(order =>
    order.id === orderId
      ? { ...order, status: newStatus } // copie modifiée
      : order
  );

  const updatedOrder = updatedOrders.find(order => order.id === orderId) ?? null;
  if (!updatedOrder) {
    return throwError(() => new Error(`Commande ${orderId} introuvable`));
  }

  return this.http.put<Order>(
    `${ORDER_API_CONFIG.BASE_URL}${ORDER_API_CONFIG.ENDPOINTS.UPDATE}/${orderId}`,
    updatedOrder,
    { withCredentials: true }
  ).pipe(
    tap(() => {
      // on met à jour uniquement si le serveur a confirmé
      this.ordersSubject.next(updatedOrders);
    }),
    catchError(err => {
      console.error('Erreur lors de la mise à jour de la commande', err);
      return throwError(() => new Error('Erreur lors de la mise à jour de la commande'));
    })
  );
}

/**
 * Annuler une commande
 */
  cancelOrder(orderId: string): Observable<Order | null> {
    console.log(`Annulation de la commande ${orderId}`);

    const orders = this.ordersSubject.getValue();

    const updatedOrders = orders.map(order =>
      order.id === orderId
        ? { ...order, status: OrderStatus.CANCELLED } // copie modifiée
        : order
    );

    const updatedOrder = updatedOrders.find(order => order.id === orderId) ?? null;
    if (!updatedOrder) {
      return throwError(() => new Error(`Commande ${orderId} introuvable`));
    }

    return this.http.put<Order>(
      `${ORDER_API_CONFIG.BASE_URL}${ORDER_API_CONFIG.ENDPOINTS.CANCEL}/${orderId}`,
      { withCredentials: true }
    ).pipe(
      tap(() => {
        // on met à jour uniquement si le serveur a confirmé
        this.ordersSubject.next(updatedOrders);
      }),
      catchError(err => {
        console.error('Erreur lors de l\'annulation de la commande', err);
        return throwError(() => new Error('Erreur lors de l\'annulation de la commande'));
      })
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