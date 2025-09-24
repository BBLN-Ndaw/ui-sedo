import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { inject } from '@angular/core';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../services/auth.service';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { NavigationUtilities } from '../services/navigation.utilities';

export interface SetPasswordDto {
  token: string;
  password: string;
}

export interface UserInfoFromToken {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
}

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.scss'
})
export class SetPasswordComponent implements OnInit, OnDestroy {
  setPasswordForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  
  // Gestion du token et des informations utilisateur
  token = '';
  isTokenValid = false;
  userInfo: UserInfoFromToken | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.setPasswordForm = this.formBuilder.group({
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }
  
  private errorHandlingUtilities = inject(ErrorHandlingUtilities);
  private navigationUtilities = inject(NavigationUtilities);

  ngOnInit(): void {
    this.extractTokenAndUserInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private extractTokenAndUserInfo(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.isTokenValid = params['valid'] === 'true';
      
      if (this.isTokenValid) {
        this.token = params['token'] || '';
        this.userInfo = {
          firstName: params['firstName'] || '',
          lastName: params['lastName'] || '',
          userName: params['userName'] || '',
          email: params['email'] || ''
        };
      } else {
        const errorMessage = params['message'] || 'Token invalide ou expiré';
        console.error(errorMessage);
        setTimeout(() => {
          this.navigationUtilities.goToLogin();
        }, 3000);
      }
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.setPasswordForm.valid && this.token) {
      this.isLoading = true;
      
      const setPasswordData: SetPasswordDto = {
        token: this.token,
        password: this.setPasswordForm.value.password
      };

      this.errorHandlingUtilities.wrapOperation(
        this.authService.setPassword(setPasswordData),
        'Définition du mot de passe',
        'Mot de passe défini avec succès! Vous pouvez maintenant vous connecter.'
      ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          // Redirection vers login après succès
          setTimeout(() => {
            this.navigationUtilities.goToLogin();
          }, 2000);
        },
        error: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.setPasswordForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.setPasswordForm.get(fieldName);
    if (!field || !field.touched) return '';

    if (field.hasError('required')) {
      return `Le ${fieldName === 'confirmPassword' ? 'mot de passe de confirmation' : 'mot de passe'} est requis`;
    }
    
    if (fieldName === 'password') {
      if (field.hasError('minlength')) {
        return 'Le mot de passe doit contenir au moins 8 caractères';
      }
      if (field.hasError('pattern')) {
        return 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial';
      }
    }
    
    if (fieldName === 'confirmPassword' && this.setPasswordForm.hasError('passwordMismatch')) {
      return 'Les mots de passe ne correspondent pas';
    }
    
    return '';
  }

  isFieldRequired(fieldName: string): boolean {
    const field = this.setPasswordForm.get(fieldName);
    return field ? field.hasValidator(Validators.required) : false;
  }

  getSubmitButtonText(): string {
    return this.isLoading ? 'Définition en cours...' : 'Définir le mot de passe';
  }

  get isSubmitDisabled(): boolean {
    return this.setPasswordForm.invalid || this.isLoading || !this.isTokenValid;
  }
}