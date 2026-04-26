import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService, Task } from '../../../core/services/task.service';
import { SubjectService, Subject } from '../../../core/services/subject.service';
import { SemesterService } from '../../../core/services/semester.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>Tasks</h2>
        <p>Track assignments, quizzes, and projects</p>
      </div>
      <button class="btn btn-primary" (click)="openModal()">
        <span class="material-icons" style="margin-right:0.5rem;font-size:1.25rem;">add</span>
        New Task
      </button>
    </div>

    <!-- Filters -->
    <div class="card glass-panel filter-bar">
      <input type="text" class="form-control" placeholder="Search tasks..."
             [value]="searchQuery" (input)="onSearch($event)">
      <select class="form-control filter-select" [value]="statusFilter" (change)="onFilterChange($event)">
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="submitted">Submitted</option>
        <option value="complete">Completed</option>
      </select>
      <select class="form-control filter-select" [value]="priorityFilter" (change)="onPriorityChange($event)">
        <option value="all">All Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>

    <!-- Loading Skeleton -->
    <div *ngIf="isLoading" class="task-list">
      <div class="skeleton-task" *ngFor="let i of [1,2,3,4]">
        <div class="skeleton-circle"></div>
        <div style="flex:1;">
          <div class="skeleton-line wide"></div>
          <div class="skeleton-line narrow"></div>
        </div>
        <div class="skeleton-line medium" style="width:80px;"></div>
      </div>
    </div>

    <!-- Task Items -->
    <div class="task-list" *ngIf="!isLoading && filteredTasks.length > 0">
      <div class="task-item glass-panel" *ngFor="let task of filteredTasks"
           [class.completed]="task.is_complete">
        <button class="check-btn" (click)="toggleComplete(task)"
                [class.checked]="task.is_complete" title="Toggle complete">
          <span class="material-icons">{{ task.is_complete ? 'check_circle' : 'radio_button_unchecked' }}</span>
        </button>

        <div class="task-body">
          <div class="task-title" [class.strikethrough]="task.is_complete">{{ task.title }}</div>
          <div class="task-meta">
            <span class="task-badge type-badge">{{ task.type }}</span>
            <span class="task-badge" [ngClass]="'priority-' + task.priority">{{ task.priority }}</span>
            <span class="task-date" *ngIf="task.due_date">
              <span class="material-icons">calendar_today</span>
              {{ task.due_date | date:'MMM d, y' }}
            </span>
          </div>
        </div>

        <div class="task-actions">
          <button class="icon-btn small" (click)="openModal(task)" title="Edit">
            <span class="material-icons">edit</span>
          </button>
          <button class="icon-btn small danger" (click)="deleteTask(task.id)" title="Delete">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state glass-panel" *ngIf="!isLoading && filteredTasks.length === 0">
      <span class="material-icons" style="font-size:4rem;color:var(--text-muted);margin-bottom:1rem;">assignment</span>
      <h3>{{ tasks.length === 0 ? "You're all caught up!" : 'No matching tasks' }}</h3>
      <p>{{ tasks.length === 0 ? 'No tasks yet. Add one to get started.' : 'Try adjusting your filters.' }}</p>
      <button class="btn btn-primary" style="margin-top:1.5rem;" *ngIf="tasks.length === 0" (click)="openModal()">
        Add First Task
      </button>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-box glass-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingTask ? 'Edit Task' : 'New Task' }}</h3>
          <button class="icon-btn" (click)="closeModal()"><span class="material-icons">close</span></button>
        </div>

        <form [formGroup]="taskForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Title <span class="required">*</span></label>
            <input type="text" class="form-control" formControlName="title" placeholder="e.g. Assignment 2">
            <div class="error-text" *ngIf="taskForm.get('title')?.touched && taskForm.get('title')?.invalid">
              Title is required
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-control" formControlName="type">
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="project">Project</option>
                <option value="exam">Exam</option>
                <option value="lab">Lab</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-control" formControlName="priority">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Subject <span class="required">*</span></label>
            <select class="form-control" formControlName="subject_id">
              <option [value]="null">— Select a Subject —</option>
              <option *ngFor="let sub of subjects" [value]="sub.id">{{ sub.name }}</option>
            </select>
            <div class="error-text" *ngIf="taskForm.get('subject_id')?.touched && taskForm.get('subject_id')?.invalid">
              Subject is required
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input type="date" class="form-control" formControlName="due_date">
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="taskForm.invalid || isSaving">
              {{ isSaving ? 'Saving...' : (editingTask ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }

    .filter-bar { display: flex; gap: 1rem; padding: 1rem 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filter-bar .form-control { flex: 1; min-width: 160px; }
    .filter-select { max-width: 160px; }

    .task-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .task-item {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem 1.25rem; border-radius: var(--radius-lg);
      border: 1px solid var(--border-color); transition: all 0.2s;
    }
    .task-item:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .task-item.completed { opacity: 0.6; }

    .check-btn {
      background: none; border: none; cursor: pointer; padding: 0;
      color: var(--text-muted); transition: color 0.2s; flex-shrink: 0;
    }
    .check-btn .material-icons { font-size: 1.5rem; }
    .check-btn.checked { color: var(--accent-primary); }
    .check-btn:hover { color: var(--accent-primary); }

    .task-body { flex: 1; }
    .task-title { font-weight: 500; margin-bottom: 0.35rem; }
    .task-title.strikethrough { text-decoration: line-through; color: var(--text-muted); }
    .task-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

    .task-badge {
      font-size: 0.7rem; font-weight: 600; text-transform: capitalize; letter-spacing: 0.03em;
      padding: 0.15rem 0.5rem; border-radius: 999px;
      background: var(--bg-primary); color: var(--text-muted); border: 1px solid var(--border-color);
    }
    .type-badge { text-transform: capitalize; }
    .priority-high { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); }
    .priority-medium { background: rgba(245,158,11,0.15); color: #f59e0b; border-color: rgba(245,158,11,0.3); }
    .priority-low { background: rgba(16,185,129,0.15); color: var(--accent-primary); border-color: rgba(16,185,129,0.3); }

    .task-date { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--text-muted); }
    .task-date .material-icons { font-size: 0.85rem; }

    .task-actions { display: flex; gap: 0.25rem; }
    .icon-btn.small { width: 30px; height: 30px; border-radius: 6px; }
    .icon-btn.small .material-icons { font-size: 1rem; }
    .icon-btn.danger { color: var(--danger); }
    .icon-btn.danger:hover { background: rgba(239,68,68,0.1); }

    /* Skeleton */
    .skeleton-task { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem;
      background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--border-color); }
    .skeleton-circle { width: 24px; height: 24px; border-radius: 50%; background: var(--bg-primary); animation: shimmer 1.5s infinite; flex-shrink: 0; }
    .skeleton-line { background: var(--bg-primary); border-radius: 4px; height: 14px; margin-bottom: 0.5rem; animation: shimmer 1.5s infinite; }
    .skeleton-line.wide { width: 70%; } .skeleton-line.medium { width: 50%; } .skeleton-line.narrow { width: 35%; }
    @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 5rem 2rem; text-align: center; border-radius: var(--radius-lg); border: 1px dashed var(--border-color); }
    .empty-state h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-box { width: 100%; max-width: 480px; padding: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-header h3 { font-size: 1.1rem; font-weight: 600; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .required { color: var(--danger); }
    .error-text { color: var(--danger); font-size: 0.75rem; margin-top: 0.25rem; }
  `]
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private subjectService = inject(SubjectService);
  private semesterService = inject(SemesterService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  tasks: Task[] = [];
  subjects: Subject[] = [];
  filteredTasks: Task[] = [];
  isLoading = true;
  showModal = false;
  isSaving = false;
  editingTask: Task | null = null;
  searchQuery = '';
  statusFilter = 'all';
  priorityFilter = 'all';

  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    type: ['assignment'],
    priority: ['medium'],
    subject_id: [null, Validators.required],
    due_date: [null]
  });

  ngOnInit() {
    this.loadAllSubjects();
    this.loadTasks();
  }

  loadAllSubjects() {
    this.semesterService.getSemesters().subscribe({
      next: (semesters) => {
        const current = semesters.find(s => s.is_current) || semesters[0];
        if (current) {
          this.subjectService.getSubjects(current.id).subscribe({
            next: (subs) => this.subjects = subs
          });
        }
      }
    });
  }

  loadTasks() {
    this.isLoading = true;
    // Fetch tasks for all — using a general approach
    this.taskService.getTasks().subscribe({
      next: (data) => { this.tasks = data; this.applyFilters(); this.isLoading = false; },
      error: () => {
        // If no "all tasks" endpoint, show empty
        this.tasks = [];
        this.filteredTasks = [];
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.tasks];
    if (this.searchQuery) {
      filtered = filtered.filter(t => t.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
    }
    if (this.statusFilter !== 'all') {
      if (this.statusFilter === 'complete') filtered = filtered.filter(t => t.is_complete);
      else if (this.statusFilter === 'submitted') filtered = filtered.filter(t => t.is_submitted);
      else if (this.statusFilter === 'pending') filtered = filtered.filter(t => !t.is_complete && !t.is_submitted);
    }
    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === this.priorityFilter);
    }
    this.filteredTasks = filtered;
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onFilterChange(event: Event) {
    this.statusFilter = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onPriorityChange(event: Event) {
    this.priorityFilter = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  openModal(task?: Task) {
    this.editingTask = task || null;
    if (task) {
      this.taskForm.patchValue({
        ...task,
        due_date: task.due_date ? task.due_date.substring(0, 10) : null
      });
    } else {
      this.taskForm.reset({ type: 'assignment', priority: 'medium', subject_id: null });
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingTask = null;
    this.taskForm.reset({ type: 'assignment', priority: 'medium' });
  }

  onSubmit() {
    if (this.taskForm.invalid) return;
    this.isSaving = true;
    const data = this.taskForm.value;
    const request = this.editingTask
      ? this.taskService.updateTask(this.editingTask.id, data)
      : this.taskService.createTask(data);

    request.subscribe({
      next: () => {
        this.toastService.show(this.editingTask ? 'Task updated!' : 'Task created!', 'success');
        this.isSaving = false;
        this.closeModal();
        this.loadTasks();
      },
      error: (err) => {
        this.toastService.show(err.error?.error || 'Failed to save task', 'error');
        this.isSaving = false;
      }
    });
  }

  toggleComplete(task: Task) {
    this.taskService.updateTask(task.id, { is_complete: !task.is_complete }).subscribe({
      next: () => {
        task.is_complete = !task.is_complete;
        this.applyFilters();
        this.toastService.show(task.is_complete ? 'Task completed! ✅' : 'Task reopened', 'success');
      },
      error: () => this.toastService.show('Failed to update task', 'error')
    });
  }

  deleteTask(id: number) {
    if (!confirm('Delete this task?')) return;
    this.taskService.deleteTask(id).subscribe({
      next: () => { this.toastService.show('Task deleted', 'success'); this.loadTasks(); },
      error: () => this.toastService.show('Failed to delete task', 'error')
    });
  }
}
