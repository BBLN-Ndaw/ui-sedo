import { Component, OnDestroy, OnInit } from '@angular/core';
import { IPayPalConfig } from 'ngx-paypal';
import { PaypalService } from '../services/paypal.service';
import { firstValueFrom, map, Subject, takeUntil } from 'rxjs';
import { Cart, Order, } from '../shared/models';
import { NotificationService } from '../services/notification.service';
import { NgxPayPalModule } from 'ngx-paypal';
import { Router } from '@angular/router';
import { MatIconModule } from "@angular/material/icon";
import { CartService } from '../services/cart.service';
import { NavigationUtilities } from '../services/navigation.utilities';



@Component({
  selector: 'app-paypal-component',
  imports: [NgxPayPalModule, MatIconModule],
  templateUrl: './paypal-component.component.html',
  styleUrl: './paypal-component.component.scss'
})
export class PaypalComponentComponent implements OnDestroy {

  public payPalConfig?: IPayPalConfig;
  private cart: Cart;

    private destroy$ = new Subject<void>();

  constructor(private paypalService: PaypalService,
    private notificationService: NotificationService,
    private navigationUtilities: NavigationUtilities,
    private cartService: CartService,
    private router: Router
  ) {
    this.cart = this.router.getCurrentNavigation()?.extras?.state?.['currentCart'];
    if(!this.cart) {
      this.loadCart();
    }
    this.initConfig();
  }
 

  /* unsubscribe from all observables */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCart(): void {
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
      });
  }

  private initConfig(): void {
    this.payPalConfig = {
      currency: 'EUR',
      clientId: 'AT_F-MUxVyzQ1S6SO230jcnyYHLiWhkkxDKWZvOdi0ldivuCzCmgvWJLvmzY5gA3LlPavkr_Kp9zBBSl', 
      createOrderOnServer: (data) =>  {
        return firstValueFrom(
          this.paypalService.createOrder(this.cart)
            .pipe(
              map((response: Order) => response.paymentOrderId!!)
            ),
        );
      },
      onApprove: (data, actions) => {
        this.paypalService.captureOrder(data.orderID)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.notificationService.showInfo('Paiement effectué avec succès !');
            this.cartService.clearCart();
            this.navigationUtilities.goToPaymentConfirmation(response);
          },
          error: (err) => this.notificationService.showInfo('Erreur lors de la capture :')
        });
      },
      onError: (err) => this.notificationService.showInfo('Erreur PayPal :')
    };
  }

  goBack() {
    this.router.navigate(['/catalog']);
  }

}
