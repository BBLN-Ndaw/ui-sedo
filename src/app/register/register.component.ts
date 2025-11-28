import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { inject } from '@angular/core';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { UserService } from '../services/user.service';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { RegisterUser, User } from '../shared/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnDestroy {
  registerForm: FormGroup;
  isLoading = false;
  private destroy$ = new Subject<void>();
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router,
  ) {
    this.registerForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.pattern("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")]],
      numTel: ['', [Validators.required, Validators.pattern(/^(?:(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4})$/)]],
      address: this.formBuilder.group({
        street: ['', [Validators.required]],
        city: ['', [Validators.required]],
        postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
        country: ['France', [Validators.required]]
      })
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const formValue = this.registerForm.value;
      
      const newUser: RegisterUser = {
        userName: formValue.username,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        numTel: formValue.numTel,
        address: formValue.address,
      };

      this.errorHandlingUtilities.wrapOperation(
        this.userService.registerUser(newUser),
        'Création de compte',
        'Votre compte a été créé avec succès ! Un email de confirmation vous a été envoyé.'
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            // Rediriger vers la page de connexion
            this.router.navigate(['/login']);
          },
          error: () => {
            this.isLoading = false;
          }
        });
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(nestedKey => {
          control.get(nestedKey)?.markAsTouched();
        });
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.getFormControl(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors?.['required']) {
      return 'Ce champ est requis';
    }
    if (control.errors?.['email']) {
      return 'Format d\'email invalide';
    }
    if (control.errors?.['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      return `Minimum ${requiredLength} caractères requis`;
    }
    if (control.errors?.['pattern']) {
      if (fieldName === 'numTel') {
        return 'Format de téléphone invalide';
      }
      if (fieldName === 'address.postalCode') {
        return 'Code postal invalide (5 chiffres)';
      }
      if(fieldName === 'email') {
        return 'Format d\'email invalide';
      }
    }
    
    return 'Champ invalide';
  }

  private getFormControl(fieldName: string) {
    if (fieldName.includes('.')) {
      const parts = fieldName.split('.');
      return this.registerForm.get(parts[0])?.get(parts[1]);
    }
    return this.registerForm.get(fieldName);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.getFormControl(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}