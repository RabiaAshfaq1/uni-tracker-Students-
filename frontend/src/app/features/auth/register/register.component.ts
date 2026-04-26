import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="card glass-panel auth-card">
      <div class="auth-header">
        <div class="logo">
          <span class="material-icons emerald-text" style="font-size: 2.5rem;">auto_graph</span>
        </div>
        <h2>Create Account</h2>
        <p>Start managing your academic journey</p>
      </div>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-control" formControlName="name" placeholder="John Doe">
          <div *ngIf="registerForm.get('name')?.touched && registerForm.get('name')?.invalid" class="error-text">
            Name is required
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-control" formControlName="email" placeholder="you@example.com">
          <div *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid" class="error-text">
            Valid email is required
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" formControlName="password" placeholder="••••••••">
          <div *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.invalid" class="error-text">
            Password must be at least 6 characters
          </div>
        </div>

        <div *ngIf="errorMessage" class="error-alert">
          {{ errorMessage }}
        </div>

        <button type="submit" class="btn btn-primary w-100" [disabled]="registerForm.invalid || isLoading">
          {{ isLoading ? 'Creating account...' : 'Sign Up' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-card {
      padding: 2.5rem 2rem;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .logo {
      margin-bottom: 1rem;
    }
    .auth-header h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .w-100 {
      width: 100%;
    }
    .error-text {
      color: var(--danger);
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }
    .error-alert {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .auth-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.875rem;
    }
  `]
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          // Auto login after registration
          this.authService.login({
            email: this.registerForm.value.email,
            password: this.registerForm.value.password
          }).subscribe(() => {
            this.router.navigate(['/dashboard']);
          });
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Registration failed. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }
}
