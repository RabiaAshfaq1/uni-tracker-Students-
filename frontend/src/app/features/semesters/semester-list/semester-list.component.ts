import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SemesterService, Semester } from '../../../core/services/semester.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-semester-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>Semesters</h2>
        <p>Manage your academic semesters and subjects</p>
      </div>
      <button class="btn btn-primary" (click)="openModal()">
        <span class="material-icons" style="margin-right:0.5rem;font-size:1.25rem;">add</span>
        New Semester
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div *ngIf="isLoading" class="semesters-grid">
      <div class="skeleton-card" *ngFor="let i of [1,2,3]">
        <div class="skeleton-line wide"></div>
        <div class="skeleton-line narrow"></div>
        <div class="skeleton-line medium"></div>
      </div>
    </div>

    <!-- Semester Cards -->
    <div class="semesters-grid" *ngIf="!isLoading && semesters.length > 0">
      <div class="semester-card glass-panel" *ngFor="let sem of semesters"
           [class.current-semester]="sem.is_current">
        <div class="card-top">
          <div class="sem-badge" [class.active-badge]="sem.is_current">
            {{ sem.is_current ? 'Current' : 'Past' }}
          </div>
          <div class="sem-actions">
            <button class="icon-btn small" (click)="openModal(sem)" title="Edit">
              <span class="material-icons">edit</span>
            </button>
            <button class="icon-btn small danger" (click)="deleteSemester(sem.id)" title="Delete">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
        <h3 class="sem-title">{{ sem.title || 'Semester ' + sem.number }}</h3>
        <p class="sem-sub">Semester {{ sem.number }}</p>
        <div class="sem-footer">
          <div class="sem-stat">
            <span class="material-icons">flag</span>
            GPA Target: <strong>{{ sem.gpa_target ?? '—' }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state glass-panel" *ngIf="!isLoading && semesters.length === 0">
      <span class="material-icons" style="font-size:4rem;color:var(--text-muted);margin-bottom:1rem;">school</span>
      <h3>No Semesters Found</h3>
      <p>Start by creating your first semester to track subjects and tasks.</p>
      <button class="btn btn-primary" style="margin-top:1.5rem;" (click)="openModal()">Create Semester</button>
    </div>

    <!-- Modal Overlay -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-box glass-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingSemester ? 'Edit Semester' : 'New Semester' }}</h3>
          <button class="icon-btn" (click)="closeModal()">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form [formGroup]="semesterForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Semester Number <span class="required">*</span></label>
            <input type="number" class="form-control" formControlName="number" placeholder="e.g. 1" min="1" max="12">
            <div class="error-text" *ngIf="semesterForm.get('number')?.touched && semesterForm.get('number')?.invalid">
              Semester number is required (1–12)
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Title <span class="hint">(optional)</span></label>
            <input type="text" class="form-control" formControlName="title" placeholder="e.g. Fall 2024">
          </div>

          <div class="form-group">
            <label class="form-label">GPA Target <span class="hint">(optional)</span></label>
            <input type="number" class="form-control" formControlName="gpa_target"
                   placeholder="e.g. 3.5" step="0.1" min="0" max="4">
          </div>

          <div class="form-group">
            <label class="toggle-label">
              <input type="checkbox" formControlName="is_current">
              <span class="toggle-text">Mark as Current Semester</span>
            </label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="semesterForm.invalid || isSaving">
              {{ isSaving ? 'Saving...' : (editingSemester ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }

    .semesters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .semester-card {
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }
    .semester-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
    .current-semester { border-color: var(--accent-primary); box-shadow: 0 0 0 1px var(--accent-primary); }

    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .sem-badge {
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
      padding: 0.2rem 0.6rem; border-radius: 999px;
      background: var(--bg-primary); color: var(--text-muted); border: 1px solid var(--border-color);
    }
    .active-badge { background: rgba(16,185,129,0.15); color: var(--accent-primary); border-color: var(--accent-primary); }

    .sem-actions { display: flex; gap: 0.25rem; }
    .icon-btn.small { width: 30px; height: 30px; border-radius: 6px; }
    .icon-btn.small .material-icons { font-size: 1rem; }
    .icon-btn.danger { color: var(--danger); }
    .icon-btn.danger:hover { background: rgba(239,68,68,0.1); }

    .sem-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem; }
    .sem-sub { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem; }
    .sem-footer { border-top: 1px solid var(--border-color); padding-top: 0.75rem; }
    .sem-stat { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--text-secondary); }
    .sem-stat .material-icons { font-size: 1rem; color: var(--accent-primary); }

    /* Skeleton */
    .skeleton-card { background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 1.5rem; border: 1px solid var(--border-color); }
    .skeleton-line { background: var(--bg-primary); border-radius: 4px; height: 14px; margin-bottom: 0.75rem; animation: shimmer 1.5s infinite; }
    .skeleton-line.wide { width: 80%; }
    .skeleton-line.medium { width: 60%; }
    .skeleton-line.narrow { width: 40%; }
    @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

    /* Empty State */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 5rem 2rem; text-align: center; border-radius: var(--radius-lg); border: 1px dashed var(--border-color); }
    .empty-state h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .empty-state p { max-width: 400px; color: var(--text-muted); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .modal-box { width: 100%; max-width: 480px; padding: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-header h3 { font-size: 1.1rem; font-weight: 600; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }

    .required { color: var(--danger); }
    .hint { font-weight: 400; color: var(--text-muted); font-size: 0.8rem; }
    .toggle-label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; }
    .toggle-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent-primary); }
    .toggle-text { font-size: 0.9rem; color: var(--text-secondary); }
    .error-text { color: var(--danger); font-size: 0.75rem; margin-top: 0.25rem; }
  `]
})
export class SemesterListComponent implements OnInit {
  private semesterService = inject(SemesterService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  semesters: Semester[] = [];
  isLoading = true;
  showModal = false;
  isSaving = false;
  editingSemester: Semester | null = null;

  semesterForm: FormGroup = this.fb.group({
    number: [null, [Validators.required, Validators.min(1), Validators.max(12)]],
    title: [''],
    gpa_target: [null],
    is_current: [false]
  });

  ngOnInit() {
    this.loadSemesters();
  }

  loadSemesters() {
    this.isLoading = true;
    this.semesterService.getSemesters().subscribe({
      next: (data) => { this.semesters = data; this.isLoading = false; },
      error: () => { this.toastService.show('Failed to load semesters', 'error'); this.isLoading = false; }
    });
  }

  openModal(semester?: Semester) {
    this.editingSemester = semester || null;
    if (semester) {
      this.semesterForm.patchValue(semester);
    } else {
      this.semesterForm.reset({ is_current: false });
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingSemester = null;
    this.semesterForm.reset({ is_current: false });
  }

  onSubmit() {
    if (this.semesterForm.invalid) return;
    this.isSaving = true;

    const data = this.semesterForm.value;
    const request = this.editingSemester
      ? this.semesterService.updateSemester(this.editingSemester.id, data)
      : this.semesterService.createSemester(data);

    request.subscribe({
      next: () => {
        this.toastService.show(this.editingSemester ? 'Semester updated!' : 'Semester created!', 'success');
        this.isSaving = false;
        this.closeModal();
        this.loadSemesters();
      },
      error: (err) => {
        this.toastService.show(err.error?.error || 'Failed to save semester', 'error');
        this.isSaving = false;
      }
    });
  }

  deleteSemester(id: number) {
    if (!confirm('Delete this semester? This cannot be undone.')) return;
    // Use updateSemester as a proxy if no delete endpoint, otherwise handle accordingly
    this.toastService.show('Delete not supported by backend yet', 'info');
  }
}
