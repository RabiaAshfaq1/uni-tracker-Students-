import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GradeService, CGPA, SemesterGPA } from '../../core/services/grade.service';
import { SemesterService, Semester } from '../../core/services/semester.service';
import { AiService, GpaAdvice } from '../../core/services/ai.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-gpa-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gpa-dashboard.component.html',
  styleUrls: ['./gpa-dashboard.component.css']
})
export class GpaDashboardComponent implements OnInit {
  private gradeService = inject(GradeService);
  private semesterService = inject(SemesterService);
  private aiService = inject(AiService);
  private toastService = inject(ToastService);

  cgpa: CGPA | null = null;
  semesters: Semester[] = [];
  semesterGPAs: { sem: Semester; gpa: SemesterGPA | null }[] = [];
  isLoadingCGPA = true;
  isLoadingSemesters = true;

  aiAdvice: GpaAdvice | null = null;
  isLoadingAI = false;
  showAI = false;

  ngOnInit() {
    this.gradeService.getCGPA().subscribe({
      next: (data) => { this.cgpa = data; this.isLoadingCGPA = false; },
      error: () => { this.isLoadingCGPA = false; }
    });

    this.semesterService.getSemesters().subscribe({
      next: (sems) => {
        this.semesters = sems;
        this.isLoadingSemesters = false;
        sems.forEach(sem => {
          this.gradeService.getSemesterGPA(sem.id).subscribe({
            next: (gpa) => this.semesterGPAs.push({ sem, gpa }),
            error: () => this.semesterGPAs.push({ sem, gpa: null })
          });
        });
      },
      error: () => { this.isLoadingSemesters = false; }
    });
  }

  getGpaAdvice() {
    if (!this.cgpa || this.semesterGPAs.length === 0) {
      this.toastService.show('Load grade data first', 'error');
      return;
    }
    this.isLoadingAI = true;
    this.showAI = true;

    const subjects = this.semesterGPAs.flatMap(s =>
      (s.gpa?.subjects || []).map(sub => ({
        name: sub.name,
        credits: sub.credits,
        gradePoint: sub.gradePoint,
        letterGrade: sub.letterGrade
      }))
    );

    this.aiService.getGpaAdvice({
      subjects,
      currentProjectedGPA: this.cgpa?.cgpa,
      semesterGPATarget: undefined
    }).subscribe({
      next: (data) => { this.aiAdvice = data; this.isLoadingAI = false; },
      error: () => {
        this.toastService.show('AI advice unavailable', 'error');
        this.isLoadingAI = false;
        this.showAI = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const map: any = { safe: 'status-safe', watch: 'status-watch', risky: 'status-risky', excellent: 'status-excellent' };
    return map[status] || '';
  }

  getRiskClass(risk: string): string {
    const map: any = { low: 'risk-low', moderate: 'risk-moderate', high: 'risk-high', critical: 'risk-critical' };
    return map[risk] || '';
  }

  getGpaColor(gpa: number): string {
    if (gpa >= 3.5) return '#10b981';
    if (gpa >= 3.0) return '#3b82f6';
    if (gpa >= 2.0) return '#f59e0b';
    return '#ef4444';
  }
}
