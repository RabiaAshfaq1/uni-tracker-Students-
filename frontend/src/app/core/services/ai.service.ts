import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface AiSuggestion {
  categorized_subjects: {
    risky: string[];
    needs_attention: string[];
    safe: string[];
    excellent: string[];
  };
  study_advice: { subject: string; advice: string }[];
  general_plan: string;
}

export interface GpaAdvice {
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  subjectAdvice: { subject: string; status: 'safe' | 'watch' | 'risky' | 'excellent'; advice: string }[];
  topPriority: string;
  motivationalNote: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private api = inject(ApiService);

  getSuggestions(): Observable<AiSuggestion> {
    return this.api.get<AiSuggestion>('/ai/suggest');
  }

  getGpaAdvice(data: { subjects: any[]; semesterGPATarget?: number; currentProjectedGPA?: number }): Observable<GpaAdvice> {
    return this.api.post<GpaAdvice>('/ai/gpa-advice', data);
  }
}
