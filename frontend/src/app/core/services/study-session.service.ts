import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface StudySession {
  id: number;
  subject_id?: number;
  title: string;
  date: string;
  duration_minutes: number;
  notes?: string;
  is_completed: boolean;
  subject?: any;
}

@Injectable({
  providedIn: 'root'
})
export class StudySessionService {
  private api = inject(ApiService);

  getSessions(): Observable<StudySession[]> {
    return this.api.get<StudySession[]>('/study-sessions');
  }

  createSession(data: Partial<StudySession>): Observable<StudySession> {
    return this.api.post<StudySession>('/study-sessions', data);
  }

  updateSession(id: number, data: Partial<StudySession>): Observable<StudySession> {
    return this.api.put<StudySession>(`/study-sessions/${id}`, data);
  }

  deleteSession(id: number): Observable<any> {
    return this.api.delete(`/study-sessions/${id}`);
  }
}
