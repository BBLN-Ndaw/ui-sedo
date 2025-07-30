import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { User } from '../../shared/models';
import { ChangePasswordRequest, UpdateUserRequest, UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  template: `<div>Profile Component - Template à créer</div>`,
  styles: []
})
export class ProfileComponent implements OnInit {
  // ===== PROPRIÉTÉS =====
  currentUser$!: Observable<User | null>;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  isEditingProfile = false;
  isChangingPassword = false;
  isLoading = false;

  // Messages
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly userService: UserService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.userService.currentUser$;
    this.initializeForms();
    this.loadUserData();
  }

  // ===== INITIALISATION =====
  
  private initializeForms(): void {
    // Formulaire de profil
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });

    // Formulaire de changement de mot de passe
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private loadUserData(): void {
    this.currentUser$.subscribe(user => {
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });
      }
    });
  }

  // ===== GESTION DU PROFIL =====
  
  enableProfileEdit(): void {
    this.isEditingProfile = true;
    this.clearMessages();
  }

  cancelProfileEdit(): void {
    this.isEditingProfile = false;
    this.loadUserData(); // Restaurer les données originales
    this.clearMessages();
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      const updateData: UpdateUserRequest = this.profileForm.value;

      this.userService.updateCurrentUserProfile(updateData).subscribe({
        next: (response) => {
          this.isEditingProfile = false;
          this.isLoading = false;
          this.successMessage = 'Profil mis à jour avec succès !';
          this.clearMessages(3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erreur lors de la mise à jour du profil.';
          this.clearMessages(5000);
          console.error('Erreur mise à jour profil:', error);
        }
      });
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }

  // ===== GESTION DU MOT DE PASSE =====
  
  enablePasswordChange(): void {
    this.isChangingPassword = true;
    this.passwordForm.reset();
    this.clearMessages();
  }

  cancelPasswordChange(): void {
    this.isChangingPassword = false;
    this.passwordForm.reset();
    this.clearMessages();
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      const passwordData: ChangePasswordRequest = this.passwordForm.value;

      this.userService.changePassword(passwordData).subscribe({
        next: (response) => {
          this.isChangingPassword = false;
          this.isLoading = false;
          this.passwordForm.reset();
          this.successMessage = 'Mot de passe changé avec succès !';
          this.clearMessages(3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erreur lors du changement de mot de passe.';
          this.clearMessages(5000);
          console.error('Erreur changement mot de passe:', error);
        }
      });
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  // ===== UTILITAIRES =====
  
  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private clearMessages(delay: number = 0): void {
    if (delay > 0) {
      setTimeout(() => {
        this.successMessage = '';
        this.errorMessage = '';
      }, delay);
    } else {
      this.successMessage = '';
      this.errorMessage = '';
    }
  }

  // ===== GETTERS POUR LE TEMPLATE =====
  
  get isAdmin(): boolean {
    return this.userService.isAdmin();
  }

  get isEmployee(): boolean {
    return this.userService.isEmployee();
  }

  get fullName(): string {
    return this.userService.getCurrentUserFullName();
  }

  // Getters pour validation des formulaires
  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
  get email() { return this.profileForm.get('email'); }
  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}
