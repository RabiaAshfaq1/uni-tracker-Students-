import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Subject {
  id: number;
  semester_id: number;
  name: string;
  credit_hours: number;
  created_at: string;
  tasks?: any[];
  marks?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private api = inject(ApiService);

  getSubjects(semesterId: number): Observable<Subject[]> {
    return this.api.get<Subject[]>(`/subjects/${semesterId}`);
  }

  createSubject(data: Partial<Subject>): Observable<Subject> {
    return this.api.post<Subject>('/subjects', data);
  }

  deleteSubject(id: number): Observable<any> {
    return this.api.delete(`/subjects/${id}`);
  }
}
