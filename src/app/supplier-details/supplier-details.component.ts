import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Subject, takeUntil} from 'rxjs';

import { Category, Supplier } from '../shared/models';
import { SupplierService } from '../services/supplier.service';
import { FormatUtilities } from '../services/format.utilities';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { NavigationUtilities } from '../services/navigation.utilities';
import { PathNames } from '../constant/path-names.enum';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './supplier-details.component.html',
  styleUrls: ['./supplier-details.component.scss']
})
export class SupplierDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private supplierService = inject(SupplierService);
  private formatUtilities = inject(FormatUtilities);
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);
  private navigationUtilities = inject(NavigationUtilities);
  private categoriesService = inject(CategoryService);

  // État du composant
  loading = false;
  supplier: Supplier | null = null;
  supplierId: string | null = null;
  categoryId: string | null = null;
  category: Category | null = null;

  // Gestion des abonnements
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Récupérer l'ID du fournisseur depuis les paramètres de route
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.supplierId = params['id'];
      if (this.supplierId) {
        this.loadSupplier();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

   private loadCategory(): void {
    this.loading = true;
    this.errorHandlingUtilities.wrapOperation(
      this.categoriesService.getcategoryById(this.categoryId!),
      'chargement des catégories'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (category) => {
          this.category = category;
          this.loading = false;
        }
      });
  }

  private loadSupplier(): void {
    if (!this.supplierId) return;

    this.loading = true;

    this.errorHandlingUtilities.wrapOperation(
      this.supplierService.getSupplierById(this.supplierId),
      'chargement du fournisseur'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (supplier) => {
        this.supplier = supplier;
        this.loading = false;
        this.categoryId = supplier.category!!;
        this.loadCategory();
      },
      error: () => {
        this.loading = false;
        this.navigationUtilities.goToRouteWithState(PathNames.suppliers);
      }
    });
  }

  onEditSupplier(): void {
    if (this.supplier?.id) {
      this.navigationUtilities.goToRouteWithQueryParams(PathNames.supplierForm, { id: this.supplier.id });
    }
  }

  onUpdateStatus(): void {
    if (!this.supplier) return;

    const newStatus = !this.supplier.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    this.errorHandlingUtilities.wrapOperation(
      this.supplierService.updateSupplierStatus(this.supplier.id!, action),
      'Mise à jour du statut du fournisseur'
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (updatedSupplier) => {
        this.supplier = updatedSupplier;
      }
    });
  }

  onDeleteSupplier(): void {
    if (!this.supplier) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le fournisseur ${this.supplier.name} ?`;
    
    if (confirm(confirmMessage)) {
      this.errorHandlingUtilities.wrapOperation(
        this.supplierService.deleteSupplier(this.supplier.id!),
        'Suppression du fournisseur',
        'Fournisseur supprimé avec succès!',
      ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.navigationUtilities.goToRouteWithState(PathNames.suppliers);
        }
      });
    }
  }

  onGoBack(): void {
    this.navigationUtilities.goToRouteWithState(PathNames.suppliers);
  }

  getContactPersonName(): string {
    if (!this.supplier?.contactPersonName) return 'Non défini';
    return this.supplier.contactPersonName;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Non définie';
    return this.formatUtilities.formatDate(date);
  }

  getStatusChipColor(): string {
    return this.supplier?.isActive ? 'primary' : 'warn';
  }

  getStatusText(): string {
    return this.supplier?.isActive ? 'Actif' : 'Inactif';
  }

  getSupplierInitials(): string {
    if (!this.supplier?.name) return 'S';
    const nameParts = this.supplier.name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  getFullAddress(): string {
    if (!this.supplier?.address) return 'Adresse non disponible';
    const addr = this.supplier.address;
    return `${addr.street}, ${addr.city} ${addr.postalCode}, ${addr.country}`.trim();
  }
}