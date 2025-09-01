import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cart, Order, PaypalCapturedResponse } from '../shared/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaypalService {

  constructor(private http: HttpClient) { }

   createOrder(cart: Cart): Observable<Order> {
    return this.http.post<Order>('http://localhost:8080/api/orders/create', cart, {
      withCredentials: true
    });
  }

   captureOrder(orderId: string): Observable<PaypalCapturedResponse> {
    return this.http.post<PaypalCapturedResponse>('http://localhost:8080/api/orders/capture-order?orderId=' + orderId, {
      withCredentials: true
    });
  }
}
