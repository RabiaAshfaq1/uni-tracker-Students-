import { Injectable, OnDestroy } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, interval, Subject, BehaviorSubject, of } from 'rxjs';
import { switchMap, catchError, takeUntil, map } from 'rxjs/operators';

export interface AppNotification {
  id: string | number;
  type: string;
  message: string;
  subject?: string;
  date?: string;
  is_read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.notifications$.pipe(
    map(notifs => notifs.filter(n => !n.is_read).length)
  );

  constructor(private api: ApiService) {
    // Initial fetch
    this.fetchNotifications().subscribe();

    // Poll every 60 seconds
    interval(60000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.fetchNotifications())
      )
      .subscribe();
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.api.get<AppNotification[]>('/notifications');
  }

  fetchNotifications(): Observable<AppNotification[]> {
    return this.getNotifications().pipe(
      map(notifs => {
        this.notificationsSubject.next(notifs);
        return notifs;
      }),
      catchError(err => {
        console.error('Failed to fetch notifications', err);
        return of([]);
      })
    );
  }

  markAsRead(id: string | number): Observable<any> {
    return this.api.put(`/notifications/${id}/read`, {}).pipe(
      map(() => {
        // Optimistically update local state
        const current = this.notificationsSubject.value;
        const updated = current.map(n => n.id === id ? { ...n, is_read: true } : n);
        this.notificationsSubject.next(updated);
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
