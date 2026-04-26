import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { 
        path: 'login', 
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      { 
        path: 'register', 
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      { 
        path: 'semesters', 
        loadComponent: () => import('./features/semesters/semester-list/semester-list.component').then(m => m.SemesterListComponent)
      },
      { 
        path: 'subjects', 
        loadComponent: () => import('./features/subjects/subject-list/subject-list.component').then(m => m.SubjectListComponent)
      },
      { 
        path: 'tasks', 
        loadComponent: () => import('./features/tasks/task-list/task-list.component').then(m => m.TaskListComponent)
      },
      {
        path: 'planner',
        loadComponent: () => import('./features/study-planner/study-planner.component').then(m => m.StudyPlannerComponent)
      },
      {
        path: 'subjects/:subjectId',
        loadComponent: () => import('./features/subjects/subject-detail/subject-detail.component').then(m => m.SubjectDetailComponent)
      },
      {
        path: 'gpa',
        loadComponent: () => import('./features/gpa-dashboard/gpa-dashboard.component').then(m => m.GpaDashboardComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
