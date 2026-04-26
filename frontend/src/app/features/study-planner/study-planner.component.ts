import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface StudySession {
  id: number;
  time: string;
  duration: number;
  title: string;
  subject: string;
}

@Component({
  selector: 'app-study-planner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Study Planner</h2>
        <p>Smart time-blocking and AI-powered scheduling</p>
      </div>
      <button class="btn btn-primary" (click)="generatePlan()">
        <span class="material-icons" style="margin-right:0.5rem;">auto_awesome</span>
        Auto-Generate Plan
      </button>
    </div>

    <div class="planner-layout">
      <!-- Sidebar / Session List -->
      <div class="planner-sidebar glass-panel card">
        <h3>Upcoming Sessions</h3>
        <div class="session-list">
          <div class="session-item" *ngFor="let session of sessions">
            <div class="session-header">
              <div class="session-time">
                <span class="material-icons" style="font-size:0.9rem;">schedule</span>
                {{ session.time }} ({{ session.duration }}m)
              </div>
              <button class="icon-btn small danger" (click)="deleteSession(session.id)" title="Remove">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="session-title">{{ session.title }}</div>
            <div class="session-subject emerald-text">{{ session.subject }}</div>
          </div>
          <div *ngIf="sessions.length === 0" class="empty-state-mini">
            <span class="material-icons">event_note</span>
            <p>No sessions yet. Add one below!</p>
          </div>
        </div>

        <button class="btn btn-secondary w-100" style="margin-top:1rem;" (click)="openAddSession()">
          <span class="material-icons" style="margin-right:0.4rem;font-size:1rem;">add</span>
          Add Manual Session
        </button>
      </div>

      <!-- Main Calendar Area -->
      <div class="planner-main glass-panel card">
        <div class="calendar-header">
          <button class="icon-btn" (click)="prevDay()">
            <span class="material-icons">chevron_left</span>
          </button>
          <h3>{{ currentDate | date:'EEEE, MMMM d, yyyy' }}</h3>
          <button class="icon-btn" (click)="nextDay()">
            <span class="material-icons">chevron_right</span>
          </button>
        </div>

        <div class="time-blocks">
          <div class="time-row" *ngFor="let hour of hours">
            <div class="time-label">{{ hour }}</div>
            <div class="time-slot">
              <ng-container *ngFor="let session of getSessionsForHour(hour)">
                <div class="block">
                  <strong>{{ session.title }}</strong>
                  <p>{{ session.subject }} · {{ session.duration }}min</p>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Session Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-box glass-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Add Study Session</h3>
          <button class="icon-btn" (click)="closeModal()"><span class="material-icons">close</span></button>
        </div>

        <form [formGroup]="sessionForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Session Title <span class="required">*</span></label>
            <input type="text" class="form-control" formControlName="title" placeholder="e.g. Math Review">
            <div class="error-text" *ngIf="sessionForm.get('title')?.touched && sessionForm.get('title')?.invalid">
              Title is required
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-control" formControlName="subject" placeholder="e.g. Calculus 101">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Time <span class="required">*</span></label>
              <select class="form-control" formControlName="time">
                <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Duration (min) <span class="required">*</span></label>
              <select class="form-control" formControlName="duration">
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="sessionForm.invalid">
              Add Session
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- AI Plan Modal -->
    <div class="modal-overlay" *ngIf="showAiModal" (click)="showAiModal = false">
      <div class="modal-box glass-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><span class="material-icons emerald-text" style="vertical-align:middle;margin-right:0.5rem;">auto_awesome</span>AI Study Plan</h3>
          <button class="icon-btn" (click)="showAiModal = false"><span class="material-icons">close</span></button>
        </div>
        <div class="ai-suggestion">
          <p style="margin-bottom:1rem;color:var(--text-secondary);">Here's a suggested daily study schedule based on your tasks:</p>
          <div class="ai-block" *ngFor="let block of aiPlan">
            <div class="ai-time">{{ block.time }}</div>
            <div>
              <div class="ai-title">{{ block.title }}</div>
              <div class="ai-sub">{{ block.subject }}</div>
            </div>
          </div>
          <button class="btn btn-primary w-100" style="margin-top:1.5rem;" (click)="applyAiPlan()">
            Apply This Plan
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
    .planner-layout { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; height: calc(100vh - 200px); }

    .planner-sidebar { display: flex; flex-direction: column; overflow-y: auto; }
    .planner-sidebar h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }
    .session-list { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; }

    .session-item { padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-sm); border-left: 4px solid var(--accent-primary); }
    .session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .session-time { display: flex; align-items: center; gap: 0.25rem; font-size: 0.7rem; color: var(--text-muted); }
    .session-title { font-weight: 500; font-size: 0.875rem; margin-bottom: 0.15rem; }
    .session-subject { font-size: 0.75rem; }

    .icon-btn.small { width: 26px; height: 26px; border-radius: 5px; }
    .icon-btn.small .material-icons { font-size: 0.9rem; }
    .icon-btn.danger { color: var(--danger); }
    .icon-btn.danger:hover { background: rgba(239,68,68,0.1); }

    .planner-main { display: flex; flex-direction: column; overflow: hidden; }
    .calendar-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
    .calendar-header h3 { font-size: 0.95rem; font-weight: 600; }
    .time-blocks { flex: 1; overflow-y: auto; padding-top: 0.5rem; display: flex; flex-direction: column; }
    .time-row { display: flex; border-bottom: 1px dashed var(--border-color); min-height: 70px; }
    .time-label { width: 80px; padding: 0.5rem 0.5rem; font-size: 0.7rem; color: var(--text-muted); text-align: right; flex-shrink: 0; }
    .time-slot { flex: 1; padding: 0.25rem 0.5rem; border-left: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.25rem; }
    .block { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.4); border-radius: 6px; padding: 0.4rem 0.6rem; font-size: 0.8rem; color: var(--text-primary); }
    .block p { font-size: 0.7rem; color: var(--text-secondary); margin: 0.1rem 0 0; }

    .w-100 { width: 100%; }
    .empty-state-mini { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem 0; text-align: center; color: var(--text-muted); font-size: 0.85rem; }
    .empty-state-mini .material-icons { font-size: 2rem; }
    .empty-state-mini p { margin: 0; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-box { width: 100%; max-width: 460px; padding: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-header h3 { font-size: 1.1rem; font-weight: 600; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .required { color: var(--danger); }
    .error-text { color: var(--danger); font-size: 0.75rem; margin-top: 0.25rem; }

    /* AI Plan */
    .ai-block { display: flex; gap: 1rem; padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-sm); margin-bottom: 0.5rem; border-left: 3px solid var(--accent-primary); }
    .ai-time { font-size: 0.75rem; color: var(--text-muted); width: 70px; flex-shrink: 0; padding-top: 0.1rem; }
    .ai-title { font-weight: 500; font-size: 0.875rem; }
    .ai-sub { font-size: 0.75rem; color: var(--accent-primary); }
  `]
})
export class StudyPlannerComponent {
  private fb = inject(FormBuilder);

  currentDate = new Date();
  hours = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
    '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
  ];
  showModal = false;
  showAiModal = false;
  private sessionIdCounter = 10;

  sessions: StudySession[] = [
    { id: 1, time: '10:00 AM', duration: 60, title: 'Math Review', subject: 'Calculus 101' },
    { id: 2, time: '2:00 PM', duration: 90, title: 'Read Chapter 4', subject: 'Physics' }
  ];

  aiPlan = [
    { time: '8:00 AM', title: 'Morning Review', subject: 'Quick summary of yesterday' },
    { time: '9:00 AM', title: 'Deep Study Block', subject: 'Most difficult subject first' },
    { time: '11:00 AM', title: 'Practice Problems', subject: 'Applied exercises' },
    { time: '2:00 PM', title: 'Reading Session', subject: 'Theory & concepts' },
    { time: '4:00 PM', title: 'Revision', subject: 'Review notes' },
  ];

  sessionForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    subject: [''],
    time: ['9:00 AM', Validators.required],
    duration: [60, Validators.required]
  });

  getSessionsForHour(hour: string): StudySession[] {
    return this.sessions.filter(s => s.time === hour);
  }

  openAddSession() {
    this.sessionForm.reset({ time: '9:00 AM', duration: 60 });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.sessionForm.reset({ time: '9:00 AM', duration: 60 });
  }

  onSubmit() {
    if (this.sessionForm.invalid) return;
    const v = this.sessionForm.value;
    this.sessions.push({
      id: ++this.sessionIdCounter,
      title: v.title,
      subject: v.subject || 'General',
      time: v.time,
      duration: Number(v.duration)
    });
    this.closeModal();
  }

  deleteSession(id: number) {
    this.sessions = this.sessions.filter(s => s.id !== id);
  }

  prevDay() {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() - 1);
    this.currentDate = d;
  }

  nextDay() {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() + 1);
    this.currentDate = d;
  }

  generatePlan() {
    this.showAiModal = true;
  }

  applyAiPlan() {
    const newSessions: StudySession[] = this.aiPlan.map((b, i) => ({
      id: ++this.sessionIdCounter + i,
      time: b.time,
      duration: 60,
      title: b.title,
      subject: b.subject
    }));
    this.sessions = [...this.sessions, ...newSessions];
    this.showAiModal = false;
  }
}
