import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="card glass-panel auth-card">
      <div class="auth-header">
        <div class="logo">
          <span class="material-icons emerald-text" style="font-size: 2.5rem;">auto_graph</span>
        </div>
        <h2>Welcome Back</h2>
        <p>Login to your UniTrack account</p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-control" formControlName="email" placeholder="you@example.com">
          <div *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid" class="error-text">
            Valid email is required
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" formControlName="password" placeholder="••••••••">
          <div *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid" class="error-text">
            Password is required
          </div>
        </div>

        <div *ngIf="errorMessage" class="error-alert">
          {{ errorMessage }}
        </div>

        <button type="submit" class="btn btn-primary w-100" [disabled]="loginForm.invalid || isLoading">
          {{ isLoading ? 'Logging in...' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>Don't have an account? <a routerLink="/register">Create one</a></p>
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
export class LoginComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Login failed. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }
}
