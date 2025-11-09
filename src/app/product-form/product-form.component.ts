import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Subject, takeUntil } from 'rxjs';

import { Product, Category, ProductWithCategoryDto } from '../shared/models';
import { ProductService } from '../services/product.service';
import { NotificationService } from '../services/notification.service';
import { NavigationUtilities } from '../services/navigation.utilities';
import { PathNames } from '../constant/path-names.enum';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-product-form',
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
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoriesService = inject(CategoryService);
  private notificationService = inject(NotificationService);
  private navigationUtilities = inject(NavigationUtilities);
  private route = inject(ActivatedRoute);
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);
  

  productForm!: FormGroup;
  loading = false;
  isEditMode = false;
  editingProductId?: string;
  categories: Category[] = [];
  
  availableUnits: string[] = ['pièce', 'kg', 'litre', 'mètre', 'gramme', 'ml'];
  
  // Images handling
  productImages: Array<{name: string, url: string, file?: File}> = [];
  maxFileSize = 5 * 1024 * 1024; // 5MB
  allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
  
  private destroy$ = new Subject<void>();

  get isFormValidWithImages(): boolean {
    return this.productForm?.valid && this.productImages.length > 0;
  }

  constructor() {
    this.editingProductId = this.route.snapshot.paramMap.get('id') || 
                           this.route.snapshot.queryParamMap.get('id') || 
                           undefined;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
    this.loadCategories();
    
    if (this.isEditMode && this.editingProductId) {
      this.loadProductWithCategory(this.editingProductId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.productForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      sku: ['', [Validators.required, Validators.minLength(3)]],
      categoryId: ['', [Validators.required]],
      supplierId: ['', [Validators.required]],
      sellingPrice: [, [Validators.required, Validators.min(0.01)]],
      taxRate: [0.20, [Validators.required, Validators.min(0), Validators.max(1)]],
      purchasePrice: [0, [Validators.required, Validators.min(0.01)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      minStock: [0, [Validators.required, Validators.min(0)]],
      unit: ['pièce', [Validators.required]],
      expirationDate: [''],
      images: this.formBuilder.array([]),
      isActive: [true],
      isOnPromotion: [false],
      promotionPrice: [0],
      promotionEndDate: [''],
      discountPercentage: [0],
    });

    this.productForm.get('isOnPromotion')?.valueChanges.subscribe(isOnPromotion => {
      this.updatePromotionValidators(isOnPromotion);
    });
  }

  private updatePromotionValidators(isOnPromotion: boolean): void {
    const promotionPriceControl = this.productForm.get('promotionPrice');
    const promotionEndDateControl = this.productForm.get('promotionEndDate');
    const discountPercentageControl = this.productForm.get('discountPercentage');

    if (isOnPromotion) {
      discountPercentageControl?.setValidators([Validators.min(0), Validators.max(100)]);
      promotionEndDateControl?.setValidators([Validators.required]);
    } else {
      promotionPriceControl?.clearValidators();
      promotionEndDateControl?.clearValidators();
      discountPercentageControl?.clearValidators();
      
      promotionPriceControl?.setValue(0);
      promotionEndDateControl?.setValue('');
      discountPercentageControl?.setValue(0);
    }

    promotionPriceControl?.updateValueAndValidity();
    promotionEndDateControl?.updateValueAndValidity();
    discountPercentageControl?.updateValueAndValidity();
  }

  private checkEditMode(): void {
    if (this.editingProductId) {
      this.isEditMode = true;
      this.productForm.updateValueAndValidity();
    }
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

  private loadProductWithCategory(productId: string): void {
    if (!productId) return;

    this.loading = true;
    this.errorHandlingUtilities.wrapOperation(
      this.productService.getProductWithCategoryById(productId),
      'chargement du produit'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          if (product) {
            this.populateForm(product);
            this.loadProductImages(product);
          }
          this.loading = false;
        }
      });
  }

  private populateForm(product: ProductWithCategoryDto): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      categoryId: product.category?.id?.toString() || '',
      supplierId: product.supplierId,
      sellingPrice: product.sellingPrice,
      taxRate: product.taxRate,
      purchasePrice: product.purchasePrice || 0,
      stockQuantity: product.stockQuantity,
      minStock: product.minStock,
      unit: product.unit,
      expirationDate: product.expirationDate,
      isActive: product.isActive,
      isOnPromotion: product.isOnPromotion,
      promotionPrice: product.promotionPrice || 0,
      promotionEndDate: product.promotionEndDate
    });

    if (product.isOnPromotion) {
      this.updatePromotionValidators(true);
    }
  }

  onSubmit(): void {
    if (!this.productForm.valid) {
      this.notificationService.showError('Veuillez corriger les erreurs dans le formulaire');
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.productForm.value;

    const productData: Product = {
      ...formValue,
      id: this.isEditMode ? this.editingProductId : undefined,
      expirationDate: formValue.expirationDate ? new Date(formValue.expirationDate) : null,
      promotionEndDate: formValue.isOnPromotion && formValue.promotionEndDate ? 
                       new Date(formValue.promotionEndDate) : undefined,
      images: this.productImages.map(img => img.url),
      promotionPrice: formValue.isOnPromotion ? formValue.promotionPrice : undefined
    };

    const validationErrors = this.productService.validateProductData(productData);
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        this.notificationService.showError(error);
      });
      this.loading = false;
      return;
    }

    if (this.isEditMode) {
      this.updateProduct(productData);
    } else {
      this.createProduct(productData);
    }
  }

  /**
   * Create a new product with image upload handling
   * Upload images first, then create the product with the uploaded URLs
   * If product creation fails, cleanup uploaded images
   */
  private createProduct(productData: Product): void {
    // Lors de la création, toutes les images sont des nouveaux fichiers à uploader
    const filesToUpload = this.productImages.map(img => img.file!);
    const productName = productData.name || productData.sku || 'product';
    
    this.errorHandlingUtilities.wrapOperation(
      this.productService.uploadProductImages(productName, filesToUpload),
      'upload des images'
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (uploadedUrls) => {
          console.log('Images uploadées avec succès:', uploadedUrls);
          const updatedProductData: Product = {
            ...productData,
            images: uploadedUrls
          };
          this.createProductWithCleanup(updatedProductData, uploadedUrls);
        },
        error: (error) => {
          console.error('Erreur lors de l\'upload des images:', error);
          this.loading = false;
        }
      });
  }

  /**
   * Create product with automatic cleanup on failure
   * @param productData - Product data with uploaded image URLs
   * @param uploadedImageUrls - URLs of uploaded images for potential cleanup
   */
  private createProductWithCleanup(productData: Product, uploadedImageUrls: string[]): void {
    this.errorHandlingUtilities.wrapOperation(
      this.productService.createProduct(productData),
      'création du produit'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          if (product) {
            this.loading = false;
            this.notificationService.showSuccess('Produit créé avec succès');
            this.goBackToProductsList();
          } else {
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Erreur lors de la création du produit:', error);
          // Nettoyer les images uploadées en cas d'échec de création du produit
          this.cleanupUploadedImages(uploadedImageUrls);
          this.loading = false;
        }
      });
  }

  /**
   * Clean up uploaded images from MinIO when product creation fails
   * @param imageUrls - URLs of images to delete
   */
  private cleanupUploadedImages(imageUrls: string[]): void {
    if (imageUrls.length > 0) {
      this.productService.deleteProductImages(imageUrls)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Images nettoyées avec succès après échec de création');
          },
          error: (error) => {
            console.warn('Erreur lors du nettoyage des images:', error);
            // Note: On log seulement l'erreur, on ne bloque pas l'utilisateur
          }
        });
    }
  }

  private updateProduct(productData: Product): void {
    const newImages = this.productImages.filter(img => img.file);
    
    if (newImages.length > 0) {
      this.uploadImagesBeforeUpdate(productData, newImages);
    } else {
      this.updateProductDirectly(productData);
    }
  }

  /**
   * Upload new images before updating the product
   */
  private uploadImagesBeforeUpdate(productData: Product, newImages: Array<{name: string, url: string, file?: File}>): void {
    const filesToUpload = newImages.map(img => img.file!);
    const productName = productData.name || productData.sku;
    
    this.errorHandlingUtilities.wrapOperation(
      this.productService.uploadProductImages(productName, filesToUpload),
      'upload des images'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (uploadedUrls) => {
          console.log('Nouvelles images uploadées avec succès:', uploadedUrls);
          
          const existingImageUrls = this.productImages
            .filter(img => !img.file)
            .map(img => img.url);
          
          const updatedProductData: Product = {
            ...productData,
            images: [...existingImageUrls, ...uploadedUrls]
          };
          this.updateProductWithCleanup(updatedProductData, uploadedUrls);
        },
        error: (error) => {
          this.loading = false;
        }
      });
  }

  /**
   * Update product with automatic cleanup on failure (for new images only)
   * @param productData - Product data with all image URLs
   * @param newUploadedImageUrls - URLs of newly uploaded images for potential cleanup
   */
  private updateProductWithCleanup(productData: Product, newUploadedImageUrls: string[]): void {
    this.errorHandlingUtilities.wrapOperation(
      this.productService.updateProduct(productData),
      'mise à jour du produit'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          if (product) {
            this.loading = false;
            this.notificationService.showSuccess('Produit mis à jour avec succès');
            this.goBackToProductsList();
          } else {
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du produit:', error);
          // Nettoyer uniquement les nouvelles images uploadées en cas d'échec
          this.cleanupUploadedImages(newUploadedImageUrls);
          this.loading = false;
        }
      });
  }

  /**
   * Update product directly without new image upload
   */
  private updateProductDirectly(productData: Product): void {
    const updateData: Product = {
      ...productData,
      id: this.editingProductId!
    };

    this.errorHandlingUtilities.wrapOperation(
      this.productService.updateProduct(updateData),
      'mise à jour du produit'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          if (product) {
            this.loading = false;
            this.notificationService.showSuccess('Produit mis à jour avec succès');
            this.goBackToProductsList();
          } else {
            this.loading = false;
          }
        },
        error: (error) => {
          this.loading = false;
        }
      });
  }

  onCancel(): void {
    this.goBackToProductsList();
  }

  goBackToProductsList(): void {
    this.navigationUtilities.goToRouteWithState(PathNames.productsList);
  }

  isFieldRequired(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `Ce champ est requis`;
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['min']) return `Valeur minimum: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valeur maximum: ${field.errors['max'].max}`;
      if (field.errors['email']) return `Format email invalide`;
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  getFormTitle(): string {
    return this.isEditMode ? 'Modifier le produit' : 'Créer un produit';
  }

  calculatePriceTTC(priceHT: number): number {
    const taxRate = this.productForm.get('taxRate')?.value;
    return priceHT * (1 + taxRate);
  }

  get sellingPriceTTC(): number {
    const sellingPrice = this.productForm.get('sellingPrice')?.value;
    return this.calculatePriceTTC(sellingPrice);
  }

  get promotionPriceTTC(): number {
    const promotionPrice = this.productForm.get('promotionPrice')?.value;
    return this.calculatePriceTTC(promotionPrice);
  }

  /**
   * Trigger the file input click event.
   * @param fileInput - The file input element to trigger.
   */
  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  /**
   * Handle the image selection event.
   * @param event - The change event from the file input.
   */
  onImageSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    
    files.forEach(file => {
      if (!this.allowedImageTypes.includes(file.type)) {
        this.notificationService.showError(`Format non supporté: ${file.name}. Utilisez JPG, PNG ou WebP.`);
        return;
      }

      if (file.size > this.maxFileSize) {
        this.notificationService.showError(`Fichier trop volumineux: ${file.name}. Taille maximum: 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.productImages.push({
          name: file.name,
          url: e.target?.result as string,
          file: file
        });
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeImage(index: number): void {
    if (index >= 0 && index < this.productImages.length) {
      this.productImages.splice(index, 1);
    }
  }

  private loadProductImages(product: ProductWithCategoryDto): void {
    if (product.imageUrls && product.imageUrls.length > 0) {
      this.productImages = product.imageUrls.map(imageUrl => ({
        name: this.extractFilenameFromUrl(imageUrl),
        url: imageUrl
      }));
    }
  }

  private extractFilenameFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'image';
  }
}