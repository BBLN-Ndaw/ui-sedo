import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  image: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Order {
  id: string;
  date: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  items: OrderItem[];
  itemCount: number;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  paymentMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  // Données de démonstration
  private mockOrders: Order[] = [
    {
      id: '#ORD-001',
      date: new Date('2024-01-15'),
      status: 'delivered',
      subtotal: 79.99,
      shipping: 7.50,
      tax: 2.50,
      total: 89.99,
      itemCount: 3,
      paymentMethod: 'Carte bancaire **** 1234',
      trackingNumber: 'FR123456789',
      items: [
        {
          id: 1,
          productId: 101,
          name: 'Smartphone Premium XR',
          image: 'assets/images/phone.jpg',
          sku: 'SPH-XR-001',
          price: 29.99,
          quantity: 1,
          total: 29.99
        },
        {
          id: 2,
          productId: 102,
          name: 'Casque Audio Bluetooth',
          image: 'assets/images/headphones.jpg',
          sku: 'AUD-BT-002',
          price: 25.00,
          quantity: 2,
          total: 50.00
        }
      ],
      shippingAddress: {
        firstName: 'Jean',
        lastName: 'Dupont',
        street: '123 Avenue de la République',
        city: 'Paris',
        postalCode: '75011',
        country: 'France',
        phone: '+33 1 23 45 67 89'
      },
      billingAddress: {
        firstName: 'Jean',
        lastName: 'Dupont',
        street: '123 Avenue de la République',
        city: 'Paris',
        postalCode: '75011',
        country: 'France'
      }
    },
    {
      id: '#ORD-002',
      date: new Date('2024-01-10'),
      status: 'shipped',
      subtotal: 140.00,
      shipping: 12.50,
      tax: 4.00,
      total: 156.50,
      itemCount: 5,
      paymentMethod: 'PayPal',
      trackingNumber: 'FR987654321',
      estimatedDelivery: new Date('2024-01-18'),
      items: [
        {
          id: 3,
          productId: 103,
          name: 'Tablette Graphique Pro',
          image: 'assets/images/tablet.jpg',
          sku: 'TAB-GP-003',
          price: 60.00,
          quantity: 1,
          total: 60.00
        },
        {
          id: 4,
          productId: 104,
          name: 'Clavier Mécanique RGB',
          image: 'assets/images/keyboard.jpg',
          sku: 'KEY-RGB-004',
          price: 20.00,
          quantity: 4,
          total: 80.00
        }
      ],
      shippingAddress: {
        firstName: 'Jean',
        lastName: 'Dupont',
        street: '123 Avenue de la République',
        city: 'Paris',
        postalCode: '75011',
        country: 'France',
        phone: '+33 1 23 45 67 89'
      },
      billingAddress: {
        firstName: 'Jean',
        lastName: 'Dupont',
        street: '123 Avenue de la République',
        city: 'Paris',
        postalCode: '75011',
        country: 'France'
      }
    },
    {
      id: '#ORD-003',
      date: new Date('2024-01-05'),
      status: 'processing',
      subtotal: 40.00,
      shipping: 3.75,
      tax: 1.50,
      total: 45.25,
      itemCount: 2,
      paymentMethod: 'Carte bancaire **** 5678',
      items: [
        {
          id: 5,
          productId: 105,
          name: 'Souris Gaming Wireless',
          image: 'assets/images/mouse.jpg',
          sku: 'MSE-GW-005',
          price: 20.00,
          quantity: 2,
          total: 40.00
        }
      ],
      shippingAddress: {
        firstName: 'Jean',
        lastName: 'Dupont',
        street: '123 Avenue de la République',
        city: 'Paris',
        postalCode: '75011',
        country: 'France',
        phone: '+33 1 23 45 67 89'
      },
      billingAddress: {
        firstName: 'Jean',
        lastName: 'Dupont',
        street: '123 Avenue de la République',
        city: 'Paris',
        postalCode: '75011',
        country: 'France'
      }
    }
  ];

  constructor() { }

  /**
   * Récupère toutes les commandes de l'utilisateur
   */
  getOrders(): Observable<Order[]> {
    return of(this.mockOrders).pipe(delay(500));
  }

  /**
   * Récupère une commande par son ID
   */
  getOrderById(orderId: string): Observable<Order | null> {
    const order = this.mockOrders.find(o => o.id === orderId);
    return of(order || null).pipe(delay(300));
  }

  /**
   * Annule une commande
   */
  cancelOrder(orderId: string): Observable<boolean> {
    const orderIndex = this.mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1 && ['pending', 'processing'].includes(this.mockOrders[orderIndex].status)) {
      this.mockOrders[orderIndex].status = 'cancelled';
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(500));
  }

  /**
   * Reommande les articles d'une commande précédente
   */
  reorderItems(orderId: string): Observable<boolean> {
    const order = this.mockOrders.find(o => o.id === orderId);
    if (order && order.status === 'delivered') {
      // Ici vous pourriez ajouter les articles au panier
      console.log('Ajout des articles au panier:', order.items);
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(500));
  }

  /**
   * Obtient les statuts de commande disponibles avec leurs informations
   */
  getOrderStatusInfo() {
    return {
      'pending': {
        label: 'En attente',
        icon: 'schedule',
        color: 'warn',
        description: 'Votre commande est en cours de traitement'
      },
      'processing': {
        label: 'En préparation',
        icon: 'autorenew',
        color: 'accent',
        description: 'Votre commande est en cours de préparation'
      },
      'shipped': {
        label: 'Expédiée',
        icon: 'local_shipping',
        color: 'primary',
        description: 'Votre commande a été expédiée'
      },
      'delivered': {
        label: 'Livrée',
        icon: 'check_circle',
        color: '',
        description: 'Votre commande a été livrée'
      },
      'cancelled': {
        label: 'Annulée',
        icon: 'cancel',
        color: 'warn',
        description: 'Votre commande a été annulée'
      }
    };
  }
}
