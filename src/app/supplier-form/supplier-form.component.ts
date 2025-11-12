import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { Subject, takeUntil } from 'rxjs';

import { Category, Supplier } from '../shared/models';
import { SupplierService } from '../services/supplier.service';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { NavigationUtilities } from '../services/navigation.utilities';
import { PathNames } from '../constant/path-names.enum';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './supplier-form.component.html',
  styleUrls: ['./supplier-form.component.scss']
})
export class SupplierFormComponent implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private supplierService = inject(SupplierService);
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);
  private navigationUtilities = inject(NavigationUtilities);
  private route = inject(ActivatedRoute);
  private categoriesService = inject(CategoryService);

  // État du composant
  loading = false;
  saving = false;
  isEditMode = false;
  editingSupplierId: string | null = null;
  categories: Category[] = [];

  supplierForm!: FormGroup; 

  // Gestion des abonnements
  private destroy$ = new Subject<void>();

  constructor() {
    this.editingSupplierId = this.route.snapshot.paramMap.get('id') || 
                            this.route.snapshot.queryParamMap.get('id') || 
                            null;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
    this.loadCategories();
    
    if (this.isEditMode && this.editingSupplierId) {
      this.loadSupplier();
    }
  }

  private checkEditMode(): void {
    if (this.editingSupplierId) {
      this.isEditMode = true;
      this.supplierForm.updateValueAndValidity();
    }
  }

  private initializeForm(): void {
    this.supplierForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      contactPersonName: ['', [Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]], 
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      category: ['', [Validators.maxLength(50)]],
      isActive: [true],
      address: this.formBuilder.group({
        street: ['', [Validators.required]],
        city: ['', [Validators.required]],
        postalCode: ['', [Validators.required]],
        country: ['France', [Validators.required]]
      })
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSupplier(): void {
    if (!this.editingSupplierId) return;

    this.loading = true;

    this.errorHandlingUtilities.wrapOperation(
      this.supplierService.getSupplierById(this.editingSupplierId),
      'chargement du fournisseur'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (supplier) => {
        this.supplierForm.patchValue(supplier);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.navigationUtilities.goToRouteWithState(PathNames.suppliers);
      }
    });
  }

  private loadCategories(): void {
    this.loading = true;
    this.errorHandlingUtilities.wrapOperation(
      this.categoriesService.getAllCategories(),
      'chargement des catégories'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories.filter(cat => cat.isActive);
          this.loading = false;
        }
      });
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    const supplierData = this.supplierForm.value as Supplier;

    // Validation côté client
    const validationErrors = this.supplierService.validateSupplierData(supplierData);
    if (validationErrors.length > 0) {
      console.error('Erreurs de validation:', validationErrors.join(', '));
      this.saving = false;
      return;
    }

    const operation = this.isEditMode
      ? this.supplierService.updateSupplier(this.editingSupplierId!!, supplierData)
      : this.supplierService.createSupplier(supplierData);

    const successMessage = this.isEditMode
      ? 'Fournisseur modifié avec succès!'
      : 'Fournisseur créé avec succès!';

    this.errorHandlingUtilities.wrapOperation(
      operation,
      this.isEditMode ? 'modification du fournisseur' : 'création du fournisseur',
      successMessage
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.saving = false;
        this.navigationUtilities.goToRouteWithState(PathNames.suppliers);
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  onCancel(): void {
    this.navigationUtilities.goToRouteWithState(PathNames.suppliers);
  }

  isFieldRequired(fieldName: string): boolean {
    const field = this.supplierForm.get(fieldName);
    return field ? field.hasError('required') && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.supplierForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field?.hasError('email')) {
      return 'Email invalide';
    }
    if (field?.hasError('minlength')) {
      return `Minimum ${field.errors?.['minlength'].requiredLength} caractères`;
    }
    if (field?.hasError('min')) {
      return `Valeur minimale: ${field.errors?.['min'].min}`;
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.supplierForm.controls).forEach(key => {
      const control = this.supplierForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markNestedFormGroupTouched(control);
      }
    });
  }

  private markNestedFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Getters pour faciliter l'accès aux contrôles d'adresse
  get addressForm(): FormGroup {
    return this.supplierForm.get('address') as FormGroup;
  }

  isAddressFieldRequired(fieldName: string): boolean {
    const field = this.addressForm.get(fieldName);
    return field ? field.hasError('required') && field.touched : false;
  }

  getAddressFieldError(fieldName: string): string {
    const field = this.addressForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    return '';
  }
}