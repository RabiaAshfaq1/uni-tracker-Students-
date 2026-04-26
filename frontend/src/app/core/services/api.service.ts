import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<T>(`${environment.apiUrl}${path}`, { params });
  }

  put<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.put<T>(
      `${environment.apiUrl}${path}`,
      JSON.stringify(body),
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  post<T>(path: string, body: Object = {}): Observable<T> {
    if (body instanceof FormData) {
      return this.http.post<T>(`${environment.apiUrl}${path}`, body);
    }
    return this.http.post<T>(
      `${environment.apiUrl}${path}`,
      JSON.stringify(body),
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  patch<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.patch<T>(
      `${environment.apiUrl}${path}`,
      JSON.stringify(body),
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${environment.apiUrl}${path}`);
  }
}
