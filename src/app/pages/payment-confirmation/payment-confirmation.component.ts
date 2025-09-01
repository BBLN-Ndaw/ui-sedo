import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-confirmation',
  templateUrl: './payment-confirmation.component.html',
  styleUrls: ['./payment-confirmation.component.scss'],
  imports: [
    CommonModule,
    MatIconModule, 
    MatButtonModule, 
    MatCardModule, 
    MatDividerModule,
    RouterModule
  ]
})
export class PaymentConfirmationComponent implements OnInit {
  
  orderDetails = {
    orderNumber: '',
    amount: '10.00',
    currency: 'EUR',
    paymentMethod: 'PayPal',
    date: new Date(),
    status: 'Confirmé'
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Générer un numéro de commande unique
    this.orderDetails.orderNumber = this.generateOrderNumber();
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `CMD-${timestamp}-${random}`;
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  continueShopping(): void {
    this.router.navigate(['/catalog']);
  }
}
