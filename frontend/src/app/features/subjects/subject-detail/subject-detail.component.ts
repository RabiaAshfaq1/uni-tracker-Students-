import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SubjectService } from '../../../core/services/subject.service';
import { ContentService, ContentItem } from '../../../core/services/content.service';
import { GradeService, Grade } from '../../../core/services/grade.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { ProgressService, SubjectProgress } from '../../../core/services/progress.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.css']
})
export class SubjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private subjectService = inject(SubjectService);
  private contentService = inject(ContentService);
  private gradeService = inject(GradeService);
  private taskService = inject(TaskService);
  private progressService = inject(ProgressService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  subjectId!: number;
  subject: any = null;
  activeTab: 'content' | 'tasks' | 'grades' | 'progress' = 'content';

  // Content
  contentItems: ContentItem[] = [];
  isLoadingContent = false;
  showContentModal = false;
  contentForm = this.fb.group({
    title: ['', Validators.required],
    type: ['pdf', Validators.required],
    url: [''],
    description: ['']
  });
  isSavingContent = false;

  // Tasks
  tasks: Task[] = [];
  isLoadingTasks = false;

  // Grades
  grade: Grade = { subject_id: 0 };
  isLoadingGrades = false;
  isSavingGrades = false;
  gradeFields = {
    quizzes: ['quiz_1','quiz_2','quiz_3','quiz_4','quiz_5'],
    assigns: ['assign_1','assign_2','assign_3','assign_4','assign_5'],
    labAssigns: ['lab_assign_1','lab_assign_2','lab_assign_3']
  };

  // Progress
  progress: SubjectProgress | null = null;
  isLoadingProgress = false;

  contentTypes = ['pdf','ppt','doc','link','assignment','notes'];

  ngOnInit() {
    this.subjectId = parseInt(this.route.snapshot.paramMap.get('subjectId') || '0');
    this.loadSubject();
    this.loadContent();
  }

  loadSubject() {
    this.subjectService.getSubjects(0).subscribe(); // fallback
  }

  setTab(tab: 'content' | 'tasks' | 'grades' | 'progress') {
    this.activeTab = tab;
    if (tab === 'tasks' && this.tasks.length === 0) this.loadTasks();
    if (tab === 'grades') this.loadGrades();
    if (tab === 'progress') this.loadProgress();
  }

  loadContent() {
    this.isLoadingContent = true;
    this.contentService.getSubjectContent(this.subjectId).subscribe({
      next: (data) => { this.contentItems = data; this.isLoadingContent = false; },
      error: () => { this.toastService.show('Failed to load content', 'error'); this.isLoadingContent = false; }
    });
  }

  loadTasks() {
    this.isLoadingTasks = true;
    this.taskService.getTasks(this.subjectId).subscribe({
      next: (data) => { this.tasks = data; this.isLoadingTasks = false; },
      error: () => { this.toastService.show('Failed to load tasks', 'error'); this.isLoadingTasks = false; }
    });
  }

  loadGrades() {
    this.isLoadingGrades = true;
    this.gradeService.getGrades(this.subjectId).subscribe({
      next: (data) => { this.grade = { ...data, subject_id: this.subjectId }; this.isLoadingGrades = false; },
      error: () => { this.isLoadingGrades = false; }
    });
  }

  loadProgress() {
    this.isLoadingProgress = true;
    this.progressService.getSubjectProgress(this.subjectId).subscribe({
      next: (data) => { this.progress = data; this.isLoadingProgress = false; },
      error: () => { this.isLoadingProgress = false; }
    });
  }

  addContent() {
    if (this.contentForm.invalid) return;
    this.isSavingContent = true;
    const formData = new FormData();
    const v = this.contentForm.value;
    formData.append('title', v.title || '');
    formData.append('type', v.type || 'note');
    if (v.url) formData.append('url', v.url);
    if (v.description) formData.append('description', v.description);
    this.contentService.uploadContent(this.subjectId, formData).subscribe({
      next: (item) => {
        this.contentItems.unshift(item);
        this.showContentModal = false;
        this.contentForm.reset({ type: 'pdf' });
        this.isSavingContent = false;
        this.toastService.show('Content added!', 'success');
      },
      error: () => { this.toastService.show('Failed to add content', 'error'); this.isSavingContent = false; }
    });
  }

  toggleContentComplete(item: ContentItem) {
    this.contentService.markContentComplete(this.subjectId, item.id, !item.is_completed).subscribe({
      next: (updated) => {
        const idx = this.contentItems.findIndex(c => c.id === item.id);
        if (idx !== -1) this.contentItems[idx] = updated;
        this.toastService.show(updated.is_completed ? 'Marked complete!' : 'Marked incomplete', 'success');
      },
      error: () => this.toastService.show('Failed to update', 'error')
    });
  }

  deleteContent(id: number) {
    if (!confirm('Delete this content item?')) return;
    this.contentService.deleteContent(this.subjectId, id).subscribe({
      next: () => { this.contentItems = this.contentItems.filter(c => c.id !== id); this.toastService.show('Deleted', 'success'); },
      error: () => this.toastService.show('Failed to delete', 'error')
    });
  }

  completeTask(task: Task) {
    this.taskService.updateTask(task.id, { is_complete: !task.is_complete }).subscribe({
      next: (updated) => {
        const idx = this.tasks.findIndex(t => t.id === task.id);
        if (idx !== -1) this.tasks[idx] = updated;
      },
      error: () => this.toastService.show('Failed to update task', 'error')
    });
  }

  submitTask(task: Task) {
    this.taskService.submitTask(task.id).subscribe({
      next: (updated) => {
        const idx = this.tasks.findIndex(t => t.id === task.id);
        if (idx !== -1) this.tasks[idx] = updated;
        this.toastService.show('Task submitted!', 'success');
      },
      error: () => this.toastService.show('Failed to submit', 'error')
    });
  }

  saveGrades() {
    this.isSavingGrades = true;
    this.gradeService.saveGrades(this.subjectId, this.grade).subscribe({
      next: (data) => {
        this.grade = data;
        this.isSavingGrades = false;
        this.toastService.show('Grades saved!', 'success');
      },
      error: () => { this.toastService.show('Failed to save grades', 'error'); this.isSavingGrades = false; }
    });
  }

  getGradeVal(key: string): number | null {
    return (this.grade as any)[key] ?? null;
  }

  setGradeVal(key: string, val: string) {
    (this.grade as any)[key] = val === '' ? null : parseFloat(val);
  }

  getTaskStatusClass(task: Task): string {
    if (task.is_submitted) return 'badge-success';
    if (task.is_complete) return 'badge-warning';
    const now = new Date();
    const due = new Date(task.due_date);
    if (due < now) return 'badge-danger';
    return 'badge-info';
  }

  getTaskStatus(task: Task): string {
    if (task.is_submitted) return 'Submitted';
    if (task.is_complete) return 'Done – Not Submitted';
    const now = new Date();
    const due = new Date(task.due_date);
    if (due < now) return 'Overdue';
    return 'Pending';
  }
}
