import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface ContentItem {
  id: number;
  subject_id: number;
  type: string;
  title: string;
  url?: string;
  description?: string;
  is_completed: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  constructor(private api: ApiService) {}

  getSubjectContent(subjectId: number | string): Observable<ContentItem[]> {
    return this.api.get<ContentItem[]>(`/content/subject/${subjectId}`);
  }

  uploadContent(subjectId: number | string, data: FormData): Observable<ContentItem> {
    return this.api.post<ContentItem>(`/content/subject/${subjectId}`, data);
  }

  markContentComplete(subjectId: number | string, contentId: number | string, isCompleted: boolean = true): Observable<ContentItem> {
    return this.api.patch<ContentItem>(`/content/subject/${subjectId}/${contentId}`, { is_completed: isCompleted });
  }

  deleteContent(subjectId: number | string, contentId: number | string): Observable<void> {
    return this.api.delete<void>(`/content/subject/${subjectId}/${contentId}`);
  }
}
