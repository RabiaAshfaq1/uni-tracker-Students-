import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Semester {
  id: number;
  number: number;
  title: string;
  gpa_target?: number;
  is_current: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SemesterService {
  private api = inject(ApiService);

  getSemesters(): Observable<Semester[]> {
    return this.api.get<Semester[]>('/semesters');
  }

  createSemester(data: Partial<Semester>): Observable<Semester> {
    return this.api.post<Semester>('/semesters', data);
  }

  updateSemester(id: number, data: Partial<Semester>): Observable<Semester> {
    return this.api.put<Semester>(`/semesters/${id}`, data);
  }
}
