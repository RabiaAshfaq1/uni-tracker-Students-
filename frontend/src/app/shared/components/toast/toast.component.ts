import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts$ | async" 
           class="toast" [ngClass]="'toast-' + toast.type">
        <div class="toast-icon">
          <span class="material-icons" *ngIf="toast.type === 'success'">check_circle</span>
          <span class="material-icons" *ngIf="toast.type === 'error'">error</span>
          <span class="material-icons" *ngIf="toast.type === 'info'">info</span>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close" (click)="toastService.remove(toast.id)">
          <span class="material-icons">close</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-sm);
      color: white;
      box-shadow: var(--shadow-glass);
      min-width: 300px;
      animation: slideIn 0.3s ease forwards;
    }
    .toast-success { background-color: var(--success); }
    .toast-error { background-color: var(--danger); }
    .toast-info { background-color: #3b82f6; }
    
    .toast-message { flex: 1; font-size: 0.875rem; font-weight: 500; }
    .toast-close { background: none; border: none; color: white; cursor: pointer; display: flex; opacity: 0.8; }
    .toast-close:hover { opacity: 1; }
    
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
