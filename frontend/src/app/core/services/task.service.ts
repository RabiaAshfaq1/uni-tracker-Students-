import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Task {
  id: number;
  subject_id: number;
  title: string;
  type: string;
  due_date: string;
  is_complete: boolean;
  is_submitted: boolean;
  submitted_at?: string;
  notes?: string;
  priority: string;
  created_at: string;
  subject?: any;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private api = inject(ApiService);

  /** Fetch tasks for a specific subject, or all tasks (falls back to empty if backend has no /tasks/all) */
  getTasks(subjectId?: number): Observable<Task[]> {
    const url = subjectId ? `/tasks/${subjectId}` : `/tasks/all`;
    return this.api.get<Task[]>(url).pipe(
      catchError(() => of([]))  // gracefully return empty array if endpoint missing
    );
  }

  createTask(data: Partial<Task>): Observable<Task> {
    return this.api.post<Task>('/tasks', data);
  }

  updateTask(id: number, data: Partial<Task>): Observable<Task> {
    return this.api.put<Task>(`/tasks/${id}`, data);
  }

  deleteTask(id: number): Observable<any> {
    return this.api.delete(`/tasks/${id}`);
  }

  submitTask(id: number): Observable<Task> {
    return this.api.patch<Task>(`/tasks/${id}/submit`, {});
  }
}
