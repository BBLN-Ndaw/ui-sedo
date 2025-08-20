import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { delay, shareReplay, tap, map } from 'rxjs/operators';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../shared/models';
import { ProductService } from './product.service';
import { NotificationService } from './notification.service';

const ORDER_API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/orders',
  ENDPOINTS: {
    CUSTOMER: '/customer',
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  orders$ = this.ordersSubject.asObservable();

  // Données de démonstration
  private mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-20230801-001",
    customerName: "Alice Martin",
    status: OrderStatus.PENDING,
    totalAmount: 120.50,
    subtotal: 100.00,
    shippingAmount: 15.00,
    taxAmount: 5.50,
    shippingAddress: {
      street: "12 Rue Lafayette",
      city: "Paris",
      postalCode: "75009",
      country: "France"
    },
    items: [
      { productId: 101, productName: "Chaussures", image: "assets/images/placeholder.svg", quantity: 1, unitPrice: 100.00, totalPrice: 100.00 }
    ],
    paymentMethod: PaymentMethod.CREDIT_CARD,
    paymentStatus: PaymentStatus.PENDING
  },
  {
    id: "2",
    orderNumber: "ORD-20230801-002",
    customerName: "Bob Dupont",
    status: OrderStatus.CONFIRMED,
    totalAmount: 75.00,
    subtotal: 70.00,
    shippingAmount: 5.00,
    taxAmount: 0.00,
    shippingAddress: {
      street: "5 Avenue Victor Hugo",
      city: "Lyon",
      postalCode: "69002",
      country: "France"
    },
    items: [
      { productId: 102, productName: "T-shirt", image: "assets/images/placeholder.svg", quantity: 2, unitPrice: 35.00, totalPrice: 70.00 }
    ],
    paymentMethod: PaymentMethod.PAYPAL,
    paymentStatus: PaymentStatus.COMPLETED
  },
  {
    id: "3",
    orderNumber: "ORD-20230801-003",
    customerName: "Claire Bernard",
    status: OrderStatus.PROCESSING,
    totalAmount: 200.00,
    subtotal: 190.00,
    shippingAmount: 10.00,
    taxAmount: 0.00,
    shippingAddress: {
      street: "8 Boulevard Haussmann",
      city: "Paris",
      postalCode: "75009",
      country: "France"
    },
    items: [
      { productId: 103, productName: "Sac à main", image: "assets/images/placeholder.svg", quantity: 1, unitPrice: 190.00, totalPrice: 190.00 }
    ],
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    paymentStatus: PaymentStatus.PENDING
  },
  {
    id: "4",
    orderNumber: "ORD-20230801-004",
    customerName: "David Leroy",
    status: OrderStatus.READY_FOR_PICKUP,
    totalAmount: 45.00,
    subtotal: 45.00,
    shippingAmount: 0.00,
    taxAmount: 0.00,
    shippingAddress: {
      street: "3 Rue Nationale",
      city: "Marseille",
      postalCode: "13001",
      country: "France"
    },
    items: [
      { productId: 104, productName: "Casquette", image: "assets/images/placeholder.svg", quantity: 1, unitPrice: 45.00, totalPrice: 45.00 }
    ],
    paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
    paymentStatus: PaymentStatus.PENDING
  },
  {
    id: "5",
    orderNumber: "ORD-20230801-005",
    customerName: "Emma Dubois",
    status: OrderStatus.SHIPPED,
    totalAmount: 300.00,
    subtotal: 280.00,
    shippingAmount: 20.00,
    taxAmount: 0.00,
    shippingAddress: {
      street: "10 Rue de la République",
      city: "Toulouse",
      postalCode: "31000",
      country: "France"
    },
    items: [
      { productId: 105, productName: "Montre", image: "assets/images/placeholder.svg", quantity: 1, unitPrice: 280.00, totalPrice: 280.00 }
    ],
    paymentMethod: PaymentMethod.CREDIT_CARD,
    paymentStatus: PaymentStatus.COMPLETED
  },
  {
    id: "6",
    orderNumber: "ORD-20230801-006",
    customerName: "François Petit",
    status: OrderStatus.DELIVERED,
    totalAmount: 50.00,
    subtotal: 45.00,
    shippingAmount: 5.00,
    taxAmount: 0.00,
    shippingAddress: {
      street: "25 Rue Saint-Pierre",
      city: "Bordeaux",
      postalCode: "33000",
      country: "France"
    },
    items: [
      { productId: 106, productName: "Livre", image: "assets/images/placeholder.svg", quantity: 3, unitPrice: 15.00, totalPrice: 45.00 }
    ],
    paymentMethod: PaymentMethod.PAYPAL,
    paymentStatus: PaymentStatus.COMPLETED
  },
  {
    id: "7",
    orderNumber: "ORD-20230801-007",
    customerName: "Gabriel Morel",
    status: OrderStatus.CANCELLED,
    totalAmount: 150.00,
    subtotal: 150.00,
    shippingAmount: 0.00,
    taxAmount: 0.00,
    shippingAddress: {
      street: "4 Rue du Commerce",
      city: "Nice",
      postalCode: "06000",
      country: "France"
    },
    items: [
      { productId: 107, productName: "Écouteurs Bluetooth", image: "assets/images/placeholder.svg", quantity: 1, unitPrice: 150.00, totalPrice: 150.00 }
    ],
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    paymentStatus: PaymentStatus.REFUNDED
  },
  {
    id: "8",
    orderNumber: "ORD-20230801-008",
    customerName: "Hélène Rousseau",
    status: OrderStatus.PENDING,
    totalAmount: 220.00,
    subtotal: 200.00,
    shippingAmount: 20.00,
    taxAmount: 0.00,
    shippingAddress: {
      street: "18 Place Bellecour",
      city: "Lyon",
      postalCode: "69002",
      country: "France"
    },
    items: [
      { productId: 108, productName: "Tablette", image: "assets/images/placeholder.svg", quantity: 1, unitPrice: 200.00, totalPrice: 200.00 }
    ],
    paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
    paymentStatus: PaymentStatus.PENDING
  }
];


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
   * Annule une commande
   */
  cancelOrder(orderId: string): Observable<boolean> {
    const orderIndex = this.mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1 && ['pending', 'processing'].includes(this.mockOrders[orderIndex].status)) {
      this.mockOrders[orderIndex].status = OrderStatus.CANCELLED;
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(500));
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

  orderProduct(productId: number, quantity: number): Observable<boolean> {
    const product = this.ordersSubject.getValue().find(p => p.items.some(item => item.productId === productId));
    // Implémentez la logique pour commander un produit
    console.log(`Commande du produit ${productId} avec la quantité ${quantity}`);
    return of(true).pipe(delay(500));
  }
}
// Removed local forkJoin stub, using rxjs forkJoin instead.

