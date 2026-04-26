import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  isSidebarCollapsed = false;
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  unreadCount$ = this.notificationService.unreadCount$;
  router = inject(Router);
  showNotifications = false;

  navItems = [
    { label: 'Dashboard', icon: 'grid_view', route: '/dashboard' },
    { label: 'Planner', icon: 'calendar_month', route: '/planner' },
    { label: 'Semesters', icon: 'school', route: '/semesters' },
    { label: 'Subjects', icon: 'menu_book', route: '/subjects' },
    { label: 'Tasks', icon: 'assignment', route: '/tasks' },
    { label: 'GPA Dashboard', icon: 'bar_chart', route: '/gpa' },
  ];

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
