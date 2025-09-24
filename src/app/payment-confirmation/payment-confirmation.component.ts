import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { PaypalCapturedResponse } from '../shared/models';
import { NavigationUtilities } from '../services/navigation.utilities';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
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
  
  private router = inject(Router);
  private navigationUtilities = inject(NavigationUtilities);
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);

  paymentInfo?: PaypalCapturedResponse;
  orderDetails = {
    orderNumber: '',
    amount: '0.00',
    currency: 'EUR',
    paymentMethod: 'PayPal',
    date: new Date(),
    status: 'Confirmé',
    customerName: '',
    customerEmail: '',
    transactionId: ''
  };

  ngOnInit(): void {
    // Récupérer les informations de paiement depuis le state de navigation
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    if (state && state['paymentInfo']) {
      this.paymentInfo = state['paymentInfo'] as PaypalCapturedResponse;
      this.populateOrderDetails();
    } else {
      // Si aucune donnée n'est disponible, rediriger vers le catalogue
      this.errorHandlingUtilities.handleError(
        'Aucune information de paiement disponible',
        undefined,
        true
      );
      setTimeout(() => {
        this.navigationUtilities.goToCatalog();
      }, 2000);
    }
  }

  private populateOrderDetails(): void {
    if (!this.paymentInfo) return;

    // Extraire les informations du paiement PayPal
    const firstPurchaseUnit = this.paymentInfo.purchase_units?.[0];
    const firstCapture = firstPurchaseUnit?.payments?.captures?.[0];
    
    this.orderDetails = {
      orderNumber: this.paymentInfo.orderNumber,
      amount: firstCapture?.amount?.value || '0.00',
      currency: firstCapture?.amount?.currency_code || 'EUR',
      paymentMethod: 'PayPal',
      date: new Date(),
      status: this.paymentInfo.status === 'COMPLETED' ? 'Confirmé' : 'En cours',
      customerName: this.getCustomerName(),
      customerEmail: this.paymentInfo.payer?.email_address || '',
      transactionId: this.paymentInfo.id
    };
  }

  private getCustomerName(): string {
    const payer = this.paymentInfo?.payer;
    if (payer?.name?.full_name) {
      return payer.name.full_name;
    }
    if (payer?.name?.given_name && payer?.name?.surname) {
      return `${payer.name.given_name} ${payer.name.surname}`;
    }
    return 'Client';
  }

  goToOrders(): void {
    this.navigationUtilities.goToRouteWithState('/orders');
  }

  continueShopping(): void {
    this.navigationUtilities.goToCatalog();
  }

  // Méthode utilitaire pour formater le montant
  getFormattedAmount(): string {
    return `${this.orderDetails.amount} ${this.orderDetails.currency}`;
  }

  // Méthode pour obtenir l'icône de statut
  getStatusIcon(): string {
    return this.orderDetails.status === 'Confirmé' ? 'check_circle' : 'hourglass_empty';
  }

  // Méthode pour obtenir la classe CSS du statut
  getStatusClass(): string {
    return this.orderDetails.status === 'Confirmé' ? 'status-confirmed' : 'status-pending';
  }
}
