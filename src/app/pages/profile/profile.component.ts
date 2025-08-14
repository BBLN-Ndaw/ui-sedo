import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { User } from '../../shared/models';
import { UserService } from '../../services/user.service';

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
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.userService.currentUser$;
    this.loadUserData();
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
}
