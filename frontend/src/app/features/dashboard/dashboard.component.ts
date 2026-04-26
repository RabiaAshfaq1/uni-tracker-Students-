import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SemesterService, Semester } from '../../core/services/semester.service';
import { TaskService, Task } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-header">
      <h2>Welcome back, {{ (authService.currentUser$ | async)?.name?.split(' ')?.[0] || 'Student' }}! 👋</h2>
      <p>Here's your academic overview for today.</p>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="card stat-card">
        <div class="stat-icon emerald-bg"><span class="material-icons">school</span></div>
        <div class="stat-details">
          <h3>Semesters</h3>
          <p class="stat-number">{{ semesters.length }}</p>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon warning-bg"><span class="material-icons">assignment_late</span></div>
        <div class="stat-details">
          <h3>Pending Tasks</h3>
          <p class="stat-number">{{ pendingTasksCount }}</p>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon primary-bg"><span class="material-icons">check_circle</span></div>
        <div class="stat-details">
          <h3>Completed Tasks</h3>
          <p class="stat-number">{{ completedTasksCount }}</p>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon purple-bg"><span class="material-icons">event</span></div>
        <div class="stat-details">
          <h3>Due Today</h3>
          <p class="stat-number">{{ dueTodayCount }}</p>
        </div>
      </div>
    </div>

    <div class="widgets-grid">

      <!-- Upcoming Tasks Widget -->
      <div class="card glass-panel">
        <div class="card-header">
          <h3>Upcoming Tasks</h3>
          <a class="btn btn-secondary compact-btn" routerLink="/tasks">View All</a>
        </div>

        <!-- Skeleton -->
        <div *ngIf="isLoadingTasks">
          <div class="skeleton-row" *ngFor="let i of [1,2,3]">
            <div class="skeleton-circle-sm"></div>
            <div style="flex:1">
              <div class="skeleton-line wide"></div>
              <div class="skeleton-line narrow"></div>
            </div>
          </div>
        </div>

        <div *ngIf="!isLoadingTasks && upcomingTasks.length > 0" class="task-preview-list">
          <div class="task-preview-item" *ngFor="let task of upcomingTasks">
            <span class="priority-dot" [ngClass]="'dot-' + task.priority"></span>
            <div class="task-preview-body">
              <span class="task-preview-title" [class.done]="task.is_complete">{{ task.title }}</span>
              <span class="task-preview-type">{{ task.type }}</span>
            </div>
            <span class="task-due-date" *ngIf="task.due_date">{{ task.due_date | date:'MMM d' }}</span>
          </div>
        </div>

        <div *ngIf="!isLoadingTasks && upcomingTasks.length === 0" class="empty-state-mini">
          <span class="material-icons">task_alt</span>
          <p>No upcoming tasks! Enjoy your free time.</p>
          <a class="btn btn-primary compact-btn" routerLink="/tasks">Add Task</a>
        </div>
      </div>

      <!-- Semesters Widget -->
      <div class="card glass-panel">
        <div class="card-header">
          <h3>Your Semesters</h3>
          <a class="btn btn-secondary compact-btn" routerLink="/semesters">Manage</a>
        </div>

        <div *ngIf="isLoadingSemesters">
          <div class="skeleton-row" *ngFor="let i of [1,2]">
            <div class="skeleton-circle-sm"></div>
            <div style="flex:1">
              <div class="skeleton-line wide"></div>
              <div class="skeleton-line narrow"></div>
            </div>
          </div>
        </div>

        <div *ngIf="!isLoadingSemesters && semesters.length > 0" class="sem-preview-list">
          <div class="sem-preview-item" *ngFor="let sem of semesters">
            <div class="sem-preview-icon" [class.active-icon]="sem.is_current">
              <span class="material-icons">school</span>
            </div>
            <div class="sem-preview-body">
              <span class="sem-preview-title">{{ sem.title || 'Semester ' + sem.number }}</span>
              <span class="sem-preview-meta">
                {{ sem.is_current ? 'Current Semester' : 'Past Semester' }}
                {{ sem.gpa_target ? ' · GPA Target: ' + sem.gpa_target : '' }}
              </span>
            </div>
            <span class="current-chip" *ngIf="sem.is_current">Active</span>
          </div>
        </div>

        <div *ngIf="!isLoadingSemesters && semesters.length === 0" class="empty-state-mini">
          <span class="material-icons">school</span>
          <p>No semesters yet.</p>
          <a class="btn btn-primary compact-btn" routerLink="/semesters">Create Semester</a>
        </div>
      </div>

      <!-- Quick Links Widget -->
      <div class="card glass-panel quick-links-card">
        <div class="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div class="quick-links-grid">
          <a class="quick-link" routerLink="/semesters">
            <span class="material-icons">school</span>
            <span>Semesters</span>
          </a>
          <a class="quick-link" routerLink="/subjects">
            <span class="material-icons">menu_book</span>
            <span>Subjects</span>
          </a>
          <a class="quick-link" routerLink="/tasks">
            <span class="material-icons">assignment</span>
            <span>Tasks</span>
          </a>
          <a class="quick-link" routerLink="/planner">
            <span class="material-icons">calendar_month</span>
            <span>Planner</span>
          </a>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-header { margin-bottom: 2rem; }
    .dashboard-header h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem 1.5rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
    .emerald-bg { background: var(--accent-primary); }
    .warning-bg { background: var(--warning); }
    .primary-bg { background: #3b82f6; }
    .purple-bg { background: #8b5cf6; }
    .stat-details h3 { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.2rem; font-weight: 500; }
    .stat-number { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); line-height: 1; }

    .widgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .card-header h3 { font-size: 1rem; font-weight: 600; }
    .compact-btn { padding: 0.3rem 0.75rem !important; font-size: 0.8rem !important; }

    /* Task Preview */
    .task-preview-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .task-preview-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); }
    .task-preview-item:last-child { border-bottom: none; }
    .priority-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot-high { background: #ef4444; }
    .dot-medium { background: #f59e0b; }
    .dot-low { background: var(--accent-primary); }
    .task-preview-body { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
    .task-preview-title { font-size: 0.875rem; font-weight: 500; }
    .task-preview-title.done { text-decoration: line-through; color: var(--text-muted); }
    .task-preview-type { font-size: 0.7rem; color: var(--text-muted); text-transform: capitalize; }
    .task-due-date { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }

    /* Semester Preview */
    .sem-preview-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .sem-preview-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); }
    .sem-preview-item:last-child { border-bottom: none; }
    .sem-preview-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; color: var(--text-muted); flex-shrink: 0; }
    .sem-preview-icon.active-icon { background: rgba(16,185,129,0.15); color: var(--accent-primary); }
    .sem-preview-icon .material-icons { font-size: 1.1rem; }
    .sem-preview-body { flex: 1; display: flex; flex-direction: column; }
    .sem-preview-title { font-size: 0.875rem; font-weight: 500; }
    .sem-preview-meta { font-size: 0.75rem; color: var(--text-muted); }
    .current-chip { font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
      background: rgba(16,185,129,0.15); color: var(--accent-primary);
      padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid rgba(16,185,129,0.3); }

    /* Quick Links */
    .quick-links-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .quick-link {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.5rem; padding: 1.25rem; border-radius: var(--radius-sm);
      background: var(--bg-primary); border: 1px solid var(--border-color);
      color: var(--text-secondary); text-decoration: none;
      transition: all 0.2s; font-size: 0.875rem; font-weight: 500;
    }
    .quick-link .material-icons { font-size: 1.5rem; color: var(--accent-primary); }
    .quick-link:hover { border-color: var(--accent-primary); color: var(--text-primary); background: rgba(16,185,129,0.05); transform: translateY(-2px); }

    /* Empty Mini State */
    .empty-state-mini { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2rem 1rem; text-align: center; color: var(--text-muted); }
    .empty-state-mini .material-icons { font-size: 2.5rem; }
    .empty-state-mini p { font-size: 0.875rem; margin: 0; }

    /* Skeleton */
    .skeleton-row { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); }
    .skeleton-circle-sm { width: 28px; height: 28px; border-radius: 50%; background: var(--bg-primary); animation: shimmer 1.5s infinite; flex-shrink: 0; }
    .skeleton-line { background: var(--bg-primary); border-radius: 4px; height: 12px; margin-bottom: 0.4rem; animation: shimmer 1.5s infinite; }
    .skeleton-line.wide { width: 75%; } .skeleton-line.narrow { width: 45%; }
    @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private semesterService = inject(SemesterService);
  private taskService = inject(TaskService);

  semesters: Semester[] = [];
  upcomingTasks: Task[] = [];
  isLoadingSemesters = true;
  isLoadingTasks = true;

  get pendingTasksCount() { return this.upcomingTasks.filter(t => !t.is_complete).length; }
  get completedTasksCount() { return this.upcomingTasks.filter(t => t.is_complete).length; }
  get dueTodayCount() {
    const today = new Date().toISOString().substring(0, 10);
    return this.upcomingTasks.filter(t => t.due_date && t.due_date.substring(0, 10) === today).length;
  }

  ngOnInit() {
    this.semesterService.getSemesters().subscribe({
      next: (data) => { this.semesters = data; this.isLoadingSemesters = false; },
      error: () => this.isLoadingSemesters = false
    });

    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.upcomingTasks = data.slice(0, 5);
        this.isLoadingTasks = false;
      },
      error: () => { this.upcomingTasks = []; this.isLoadingTasks = false; }
    });
  }
}
