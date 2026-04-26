import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SubjectService, Subject } from '../../../core/services/subject.service';
import { SemesterService, Semester } from '../../../core/services/semester.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>Subjects</h2>
        <p>Manage your subjects and calculate your GPA</p>
      </div>
      <button class="btn btn-primary" [disabled]="!selectedSemesterId" (click)="openModal()">
        <span class="material-icons" style="margin-right:0.5rem;font-size:1.25rem;">add</span>
        Add Subject
      </button>
    </div>

    <!-- Semester Selector -->
    <div class="card glass-panel semester-picker" *ngIf="semesters.length > 0">
      <label class="form-label" style="margin-bottom:0.5rem;">Select Semester</label>
      <div class="sem-tabs">
        <button
          *ngFor="let sem of semesters"
          class="sem-tab"
          [class.active]="selectedSemesterId === sem.id"
          (click)="selectSemester(sem.id)">
          <span>{{ sem.title || 'Semester ' + sem.number }}</span>
          <span class="current-dot" *ngIf="sem.is_current">●</span>
        </button>
      </div>
    </div>

    <!-- No semesters -->
    <div class="empty-state glass-panel" *ngIf="!isLoadingSemesters && semesters.length === 0">
      <span class="material-icons" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;">school</span>
      <h3>No Semesters Found</h3>
      <p>Go to Semesters page and create one first.</p>
    </div>

    <!-- Loading skeleton -->
    <div class="subjects-grid" *ngIf="isLoadingSubjects">
      <div class="skeleton-card" *ngFor="let i of [1,2,3,4]">
        <div class="skeleton-line wide"></div>
        <div class="skeleton-line narrow"></div>
        <div class="skeleton-line medium"></div>
      </div>
    </div>

    <!-- Subject Cards -->
    <div class="subjects-grid" *ngIf="!isLoadingSubjects && subjects.length > 0">
      <div class="subject-card glass-panel" *ngFor="let sub of subjects">
        <div class="card-top">
          <div class="sub-icon">
            <span class="material-icons">menu_book</span>
          </div>
          <div class="sub-actions">
            <button class="icon-btn small danger" (click)="deleteSubject(sub.id)" title="Delete">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
        <h3 class="sub-name">{{ sub.name }}</h3>
        <div class="sub-credits">
          <span class="material-icons" style="font-size:1rem;">grade</span>
          {{ sub.credit_hours }} Credit Hour{{ sub.credit_hours !== 1 ? 's' : '' }}
        </div>
        <a [routerLink]="['/subjects', sub.id]" class="view-details-btn">View Details →</a>
      </div>
    </div>

    <!-- Empty subjects -->
    <div class="empty-state glass-panel"
         *ngIf="!isLoadingSubjects && subjects.length === 0 && selectedSemesterId">
      <span class="material-icons" style="font-size:4rem;color:var(--text-muted);margin-bottom:1rem;">menu_book</span>
      <h3>No Subjects Found</h3>
      <p>Add subjects for this semester to start tracking your progress.</p>
      <button class="btn btn-primary" style="margin-top:1.5rem;" (click)="openModal()">Add Subject</button>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-box glass-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Add Subject</h3>
          <button class="icon-btn" (click)="closeModal()"><span class="material-icons">close</span></button>
        </div>

        <form [formGroup]="subjectForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Subject Name <span class="required">*</span></label>
            <input type="text" class="form-control" formControlName="name" placeholder="e.g. Calculus II">
            <div class="error-text" *ngIf="subjectForm.get('name')?.touched && subjectForm.get('name')?.invalid">
              Subject name is required
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Credit Hours <span class="required">*</span></label>
            <input type="number" class="form-control" formControlName="credit_hours"
                   placeholder="e.g. 3" min="1" max="6">
            <div class="error-text" *ngIf="subjectForm.get('credit_hours')?.touched && subjectForm.get('credit_hours')?.invalid">
              Credit hours required (1–6)
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="subjectForm.invalid || isSaving">
              {{ isSaving ? 'Adding...' : 'Add Subject' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }

    .semester-picker { padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border-radius: var(--radius-lg); }
    .sem-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .sem-tab {
      padding: 0.4rem 1rem; border-radius: 999px; font-size: 0.85rem;
      border: 1px solid var(--border-color); background: var(--bg-primary);
      color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; gap: 0.35rem;
    }
    .sem-tab:hover { border-color: var(--accent-primary); color: var(--text-primary); }
    .sem-tab.active { background: rgba(16,185,129,0.15); border-color: var(--accent-primary); color: var(--accent-primary); font-weight: 600; }
    .current-dot { font-size: 0.6rem; color: var(--accent-primary); }

    .subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }

    .subject-card { padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); transition: transform 0.2s; }
    .subject-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .sub-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(16,185,129,0.15); display: flex; align-items: center; justify-content: center; color: var(--accent-primary); }
    .sub-name { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .sub-credits { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--text-muted); }
    .view-details-btn { display: inline-block; margin-top: 0.75rem; font-size: 0.8rem; color: var(--accent-primary); text-decoration: none; font-weight: 500; transition: gap 0.2s; }
    .view-details-btn:hover { text-decoration: underline; }

    .icon-btn.small { width: 30px; height: 30px; border-radius: 6px; }
    .icon-btn.small .material-icons { font-size: 1rem; }
    .icon-btn.danger { color: var(--danger); }
    .icon-btn.danger:hover { background: rgba(239,68,68,0.1); }

    /* Skeleton */
    .skeleton-card { background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 1.5rem; border: 1px solid var(--border-color); }
    .skeleton-line { background: var(--bg-primary); border-radius: 4px; height: 14px; margin-bottom: 0.75rem; animation: shimmer 1.5s infinite; }
    .skeleton-line.wide { width: 80%; } .skeleton-line.medium { width: 60%; } .skeleton-line.narrow { width: 40%; }
    @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 5rem 2rem; text-align: center; border-radius: var(--radius-lg); border: 1px dashed var(--border-color); }
    .empty-state h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .empty-state p { color: var(--text-muted); }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-box { width: 100%; max-width: 440px; padding: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-header h3 { font-size: 1.1rem; font-weight: 600; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .required { color: var(--danger); }
    .error-text { color: var(--danger); font-size: 0.75rem; margin-top: 0.25rem; }
  `]
})
export class SubjectListComponent implements OnInit {
  private subjectService = inject(SubjectService);
  private semesterService = inject(SemesterService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  semesters: Semester[] = [];
  subjects: Subject[] = [];
  selectedSemesterId: number | null = null;
  isLoadingSemesters = true;
  isLoadingSubjects = false;
  showModal = false;
  isSaving = false;

  subjectForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    credit_hours: [3, [Validators.required, Validators.min(1), Validators.max(6)]]
  });

  ngOnInit() {
    this.semesterService.getSemesters().subscribe({
      next: (data) => {
        this.semesters = data;
        this.isLoadingSemesters = false;
        const current = data.find(s => s.is_current) || data[0];
        if (current) this.selectSemester(current.id);
      },
      error: () => { this.toastService.show('Failed to load semesters', 'error'); this.isLoadingSemesters = false; }
    });
  }

  selectSemester(id: number) {
    this.selectedSemesterId = id;
    this.isLoadingSubjects = true;
    this.subjectService.getSubjects(id).subscribe({
      next: (data) => { this.subjects = data; this.isLoadingSubjects = false; },
      error: () => { this.toastService.show('Failed to load subjects', 'error'); this.isLoadingSubjects = false; }
    });
  }

  openModal() { this.subjectForm.reset({ credit_hours: 3 }); this.showModal = true; }
  closeModal() { this.showModal = false; this.subjectForm.reset({ credit_hours: 3 }); }

  onSubmit() {
    if (this.subjectForm.invalid || !this.selectedSemesterId) return;
    this.isSaving = true;
    const data = { ...this.subjectForm.value, semester_id: this.selectedSemesterId };
    this.subjectService.createSubject(data).subscribe({
      next: () => {
        this.toastService.show('Subject added!', 'success');
        this.isSaving = false;
        this.closeModal();
        this.selectSemester(this.selectedSemesterId!);
      },
      error: (err) => {
        this.toastService.show(err.error?.error || 'Failed to add subject', 'error');
        this.isSaving = false;
      }
    });
  }

  deleteSubject(id: number) {
    if (!confirm('Delete this subject?')) return;
    this.subjectService.deleteSubject(id).subscribe({
      next: () => {
        this.toastService.show('Subject deleted', 'success');
        this.selectSemester(this.selectedSemesterId!);
      },
      error: () => this.toastService.show('Failed to delete subject', 'error')
    });
  }
}
