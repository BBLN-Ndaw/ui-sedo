import { Pipe, PipeTransform } from '@angular/core';
import { Order, OrderStatus } from '../models/index';

@Pipe({
  name: 'statusOptions',
  pure: true, // Performance optimisée : ne recalcule que si les inputs changent
  standalone: true
})
export class StatusOptionsPipe implements PipeTransform {

  transform(order: Order): { status: OrderStatus; label: string }[] {
    if (!order || !order.status) {
      return [];
    }

    // Définir toutes les options possibles
    const allOptions = [
      { status: OrderStatus.CONFIRMED, label: 'Confirmer' },
      { status: OrderStatus.PROCESSING, label: 'Mettre en préparation' },
      { status: OrderStatus.READY_FOR_PICKUP, label: 'Prête pour retrait' },
      { status: OrderStatus.SHIPPED, label: 'Marquer comme expédiée' },
      { status: OrderStatus.DELIVERED, label: 'Marquer comme livrée' },
      { status: OrderStatus.CANCELLED, label: 'Annuler' }
    ];

    // Filtrer selon les transitions valides
    return allOptions.filter(option => this.canChangeStatus(order, option.status));
  }

  private canChangeStatus(order: Order, newStatus: OrderStatus): boolean {
    // Logique métier pour déterminer si un changement de statut est autorisé
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      return false;
    }
    
    // Empêcher les transitions illogiques
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: []
    };
    
    return validTransitions[order.status]?.includes(newStatus) || false;
  }
}