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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { Subject, takeUntil } from 'rxjs';

import { User } from '../shared/models';
import { UserService } from '../services/user.service';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { NavigationUtilities } from '../services/navigation.utilities';
import { PathNames } from '../constant/path-names.enum';

@Component({
  selector: 'app-user-form',
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
    MatDividerModule
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);
  private navigationUtilities = inject(NavigationUtilities);
  private route = inject(ActivatedRoute);

  userForm!: FormGroup;
  loading = false;
  isEditMode = false;
  editingUserId?: string;
  availableRoles: string[] = ['ADMIN', 'EMPLOYEE', 'CUSTOMER']; 
  
  private destroy$ = new Subject<void>();
  private originalFormValue: any;

  constructor() {
    this.editingUserId = this.route.snapshot.queryParamMap.get('id') || undefined;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadUser(this.editingUserId!);
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.userForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.pattern("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")]],
      numTel: ['', [Validators.required, Validators.pattern(/^(?:(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4})$/)]],
      roles: [['CUSTOMER'], [Validators.required]],
      isActive: [false],
      address: this.formBuilder.group({
        street: ['', [Validators.required]],
        city: ['', [Validators.required]],
        postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
        country: ['France', [Validators.required]]
      })
    });
  }

  private checkEditMode(): void {
        if (this.editingUserId) { // Si un ID utilisateur est présent dans les paramètres de requête, on est en mode édition
          this.isEditMode = true;
          this.userForm.updateValueAndValidity();
        }
      ;
  }

  private loadUser(userId: string): void {
    if (!userId) return;
    this.loading = true;
    this.errorHandlingUtilities.wrapOperation(
      this.userService.getUserById(userId),
      "Chargement de l'utilisateur"
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.populateFormWithUser(user);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  private populateFormWithUser(user: User): void {
    this.userForm.patchValue({
      username: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      numTel: user.numTel,
      roles: user.roles,
      isActive: user.isActive,
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || 'France'
      }
    });
    
    // Sauvegarder la valeur originale pour détecter les changements
    this.originalFormValue = this.userForm.value;
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      
      if (this.isEditMode && this.editingUserId) {
        this.updateUser();
      } else {
        this.createUser();
      }
    } else {
      this.markFormGroupTouched(this.userForm);
    }
  }

  private createUser(): void {
    const formValue = this.userForm.value;
    
    const createRequest: User = {
      userName: formValue.username,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      numTel: formValue.numTel,
      roles: formValue.roles,
      isActive: formValue.isActive,
      address: {
        street: formValue.address.street,
        city: formValue.address.city,
        postalCode: formValue.address.postalCode,
        country: formValue.address.country
      }
    };

    this.errorHandlingUtilities.wrapOperation(
      this.userService.createUser(createRequest),
      'Création de l\'utilisateur',
      'Utilisateur créé avec succès ! Le compte est désactivé par défaut. L\'utilisateur recevra un email pour définir son mot de passe.'
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.loading = false;
        this.goBack();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private updateUser(): void {
    if (!this.editingUserId) return;
    
    const formValue = this.userForm.value;
    
    const updateRequest: User = {
      id: Number(this.editingUserId),
      userName: formValue.username,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      numTel: formValue.numTel,
      isActive: formValue.isActive,
      roles: formValue.roles,
      address: {
        street: formValue.address.street,
        city: formValue.address.city,
        postalCode: formValue.address.postalCode,
        country: formValue.address.country
      }
    };

    this.errorHandlingUtilities.wrapOperation(
      this.userService.updateUserById(this.editingUserId, updateRequest),
      'Mise à jour de l\'utilisateur',
      'Utilisateur mis à jour avec succès!'
    ).pipe(takeUntil(this.destroy$))
    .subscribe(
      {
        next: () => {
          this.loading = false;
          this.goBack();
        },
        error: () => {
          this.loading = false;
        }
      }
    );
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Vérifie si le formulaire a été modifié par rapport à sa valeur originale
   */
  hasFormChanged(): boolean {
    if (!this.originalFormValue) {
      return true; 
    }

    if (!this.userForm.dirty) {
      return false;
    }

    const currentValue = this.userForm.value;
    
    const normalizedCurrent = this.normalizeFormValue(currentValue);
    const normalizedOriginal = this.normalizeFormValue(this.originalFormValue);
    
    return JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedOriginal);
  }

  /**
   * Normalise les valeurs du formulaire en supprimant les espaces superflus
   */
  private normalizeFormValue(value: any): any {
    if (!value) return value;
    
    const normalized = { ...value };
    
    if (normalized.username) normalized.username = normalized.username.trim();
    if (normalized.firstName) normalized.firstName = normalized.firstName.trim();
    if (normalized.lastName) normalized.lastName = normalized.lastName.trim();
    if (normalized.email) normalized.email = normalized.email.trim();
    if (normalized.numTel) normalized.numTel = normalized.numTel.trim();
    
    if (normalized.address) {
      normalized.address = { ...normalized.address };
      if (normalized.address.street) normalized.address.street = normalized.address.street.trim();
      if (normalized.address.city) normalized.address.city = normalized.address.city.trim();
      if (normalized.address.postalCode) normalized.address.postalCode = normalized.address.postalCode.trim();
      if (normalized.address.country) normalized.address.country = normalized.address.country.trim();
    }
    
    return normalized;
  }

  goBack(): void {
    this.navigationUtilities.goToRouteWithState(PathNames.users);
  }

  getFormTitle(): string {
    return this.isEditMode ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur';
  }

  getSubmitButtonText(): string {
    if (this.isEditMode) {
      if (!this.hasFormChanged()) {
        return this.userForm.dirty ? 'Aucun changement significatif' : 'Aucun changement';
      }
      return 'Mettre à jour';
    }
    return 'Créer';
  }

  isSubmitDisabled(): boolean {
    return this.loading || (this.isEditMode && !this.hasFormChanged());
  }

  isFieldRequired(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return field?.hasError('required') && field?.touched || false;
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field?.hasError('email')) {
      return 'Email invalide';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    if (field?.hasError('pattern')) {
      if (fieldName === 'numTel') {
        return 'Numéro de téléphone invalide';
      }
      if (fieldName === 'address.postalCode') {
        return 'Code postal invalide (5 chiffres)';
      }
    }
    
    return '';
  }
}