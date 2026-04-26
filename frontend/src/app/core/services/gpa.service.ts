import { Injectable } from '@angular/core';

export interface SubjectMarks {
  quiz_obtained?: number; quiz_total?: number;
  assignment_obtained?: number; assignment_total?: number;
  mid_obtained?: number; mid_total?: number;
  final_obtained?: number; final_total?: number;
  lab_assignment_obtained?: number; lab_assignment_total?: number;
  lab_mid_obtained?: number; lab_mid_total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GpaCalculatorService {
  
  calculateSubjectGpa(marks: SubjectMarks | null | undefined): number | null {
    if (!marks) return null;
    
    let totalObtained = 0;
    let totalMax = 0;

    if (marks.quiz_total) { totalObtained += (marks.quiz_obtained || 0); totalMax += marks.quiz_total; }
    if (marks.assignment_total) { totalObtained += (marks.assignment_obtained || 0); totalMax += marks.assignment_total; }
    if (marks.mid_total) { totalObtained += (marks.mid_obtained || 0); totalMax += marks.mid_total; }
    if (marks.final_total) { totalObtained += (marks.final_obtained || 0); totalMax += marks.final_total; }
    if (marks.lab_assignment_total) { totalObtained += (marks.lab_assignment_obtained || 0); totalMax += marks.lab_assignment_total; }
    if (marks.lab_mid_total) { totalObtained += (marks.lab_mid_obtained || 0); totalMax += marks.lab_mid_total; }

    if (totalMax === 0) return null;

    const percentage = (totalObtained / totalMax) * 100;
    
    if (percentage >= 85) return 4.0;
    if (percentage >= 80) return 3.7;
    if (percentage >= 75) return 3.3;
    if (percentage >= 71) return 3.0;
    if (percentage >= 68) return 2.7;
    if (percentage >= 64) return 2.3;
    if (percentage >= 61) return 2.0;
    if (percentage >= 58) return 1.7;
    if (percentage >= 50) return 1.0;
    return 0.0;
  }

  calculateSemesterGpa(subjects: any[]): string {
    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach(sub => {
      const gpa = this.calculateSubjectGpa(sub.marks);
      if (gpa !== null && sub.credit_hours) {
        totalPoints += (gpa * sub.credit_hours);
        totalCredits += sub.credit_hours;
      }
    });

    if (totalCredits === 0) return 'N/A';
    return (totalPoints / totalCredits).toFixed(2);
  }
}
