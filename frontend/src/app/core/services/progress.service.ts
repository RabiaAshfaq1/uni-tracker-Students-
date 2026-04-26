import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface SubjectProgress {
  contentTotal: number;
  contentCompleted: number;
  contentPercent: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksSubmitted: number;
  tasksPendingSubmit: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  constructor(private api: ApiService) {}

  getSubjectProgress(subjectId: number | string): Observable<SubjectProgress> {
    return this.api.get<SubjectProgress>(`/progress/${subjectId}`);
  }
}
