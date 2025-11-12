import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { Category } from '../shared/models';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.scss']
})
export class CategoriesListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  
  loading = false;
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  searchTerm = '';
  displayedColumns = ['name', 'description', 'isActive', 'actions'];

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getAllCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.filteredCategories = cats;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = this.categories;
      return;
    }

    this.filteredCategories = this.categories.filter(category =>
      category.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.filteredCategories = this.categories;
  }

  onEdit(category: Category) {
    this.router.navigate(['/category-form', category.id]);
  }

  onToggleStatus(category: Category) {
    this.categoryService.updateCategoryStatus(category.id!, !category.isActive).subscribe(() => {
      category.isActive = !category.isActive;
    });
  }

  onCreate() {
    this.router.navigate(['/category-form']);
  }

  getActiveCount(): number {
    return this.categories.filter(cat => cat.isActive).length;
  }

  getInactiveCount(): number {
    return this.categories.filter(cat => !cat.isActive).length;
  }
}
