import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-container">
      <div class="auth-background"></div>
      <div class="auth-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .auth-background {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(15,23,42,1) 50%);
      z-index: 0;
    }
    .auth-content {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 450px;
      padding: 2rem;
    }
  `]
})
export class AuthLayoutComponent {}
