import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Grade {
  id?: number;
  subject_id: number;
  
  quiz_1?: number; quiz_2?: number; quiz_3?: number; quiz_4?: number; quiz_5?: number;
  assign_1?: number; assign_2?: number; assign_3?: number; assign_4?: number; assign_5?: number;
  lab_assign_1?: number; lab_assign_2?: number; lab_assign_3?: number;
  
  mid?: number;
  lab_mid?: number;
  final?: number;
  
  total_marks?: number;
  grade_point?: number;
  letter_grade?: string;
}

export interface SubjectGPA {
  name: string;
  credits: number;
  gradePoint?: number;
  letterGrade?: string;
}

export interface SemesterGPA {
  semesterGPA: number;
  subjects: SubjectGPA[];
  totalCredits: number;
}

export interface SemesterRecord {
  name: string;
  gpa: number;
  credits: number;
}

export interface CGPA {
  cgpa: number;
  semesters: SemesterRecord[];
  previousCGPA?: number;
  totalCredits: number;
}

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  constructor(private api: ApiService) {}

  getGrades(subjectId: number | string): Observable<Grade> {
    return this.api.get<Grade>(`/grades/subject/${subjectId}`);
  }

  saveGrades(subjectId: number | string, grades: Partial<Grade>): Observable<Grade> {
    return this.api.put<Grade>(`/grades/subject/${subjectId}`, grades);
  }

  getSemesterGPA(semesterId: number | string): Observable<SemesterGPA> {
    return this.api.get<SemesterGPA>(`/grades/semester/${semesterId}/gpa`);
  }

  getCGPA(): Observable<CGPA> {
    return this.api.get<CGPA>(`/grades/cgpa`);
  }
}
