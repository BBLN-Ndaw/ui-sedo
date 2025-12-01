import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService, LoginCredentials } from '../services/auth.service';
import { ErrorHandlingUtilities } from '../services/error-handling.utilities';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../services/user.service';
import { RequestPasswordResetRequestDto } from '../shared/models';

@Component({
  selector: 'app-login',
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
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  loginForm: FormGroup;
  emailFormControl = new FormControl('', [Validators.required, Validators.pattern("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")]);
  isLoading = false;
  hidePassword = true;
  showForgotPassword = false;
  isResetLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
    private errorHandlingUtilities: ErrorHandlingUtilities
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const credentials: LoginCredentials = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };
      this.errorHandlingUtilities.wrapOperation(
      this.authService.login(credentials),
      'Connexion utilisateur',
      'Connexion réussie'
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['']);
        },
        error: () => {
          this.isLoading = false;
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.snackBar.open('Veuillez remplir tous les champs correctement.', 'Fermer', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.hasError('required')) {
      return `The ${fieldName} is required`;
    }
    if (field?.hasError('minlength') || field?.hasError('maxlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `The ${fieldName} must have at least ${minLength} caracters`;
    }
    return '';
  }

  toggleForgotPassword(): void {
    console.log('Toggling forgot password. Current state:', this.showForgotPassword);
    this.showForgotPassword = !this.showForgotPassword;
    this.emailFormControl.reset();
  }

  requestPasswordReset(): void {
    const email = this.emailFormControl.value || ''
    this.isResetLoading = true;
    const requestPasswordResetRequestDto: RequestPasswordResetRequestDto = { email: email };

    this.errorHandlingUtilities.wrapOperation(
    this.userService.requestPasswordReset(requestPasswordResetRequestDto),
    'Réinitialisation de mot de passe',
    'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.isResetLoading = false;
        this.showForgotPassword = false;
        this.emailFormControl.setValue('');
      },
      error: () => {
        this.isResetLoading = false;
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}

