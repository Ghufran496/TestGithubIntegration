import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userIdSubject = new BehaviorSubject<string | null>(null);
  
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  userId$ = this.userIdSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Check if user is already authenticated - only in browser
    if (this.isBrowser) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.userIdSubject.next(userId);
        // We'll do a single check here, not a subscription
        this.checkAuthStatus(userId).subscribe({
          next: (response: any) => {
            console.log('Initial auth status check:', response);
            this.isAuthenticatedSubject.next(response.authenticated);
          },
          error: (err) => console.error('Initial auth status check failed:', err)
        });
      }
    }
  }

  initiateGithubAuth(): void {
    if (this.isBrowser) {
      console.log('Initiating GitHub auth, redirecting to:', `${this.apiUrl}/github`);
      window.location.href = `${this.apiUrl}/github`;
    }
  }

  setAuthState(token: string, userId: string, checkStatus: boolean = true): void {
    console.log('Setting auth state with token and userId:', userId);
    if (this.isBrowser) {
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
    }
    this.userIdSubject.next(userId);
    this.isAuthenticatedSubject.next(true);
    
    // Only check status if explicitly requested
    if (checkStatus) {
      this.checkAuthStatus(userId).subscribe({
        next: (response) => console.log('Auth status response:', response),
        error: (err) => console.error('Auth status check failed:', err)
      });
    }
  }

  checkAuthStatus(userId: string): Observable<any> {
    console.log('Checking auth status for userId:', userId);
    return this.http.get(`${this.apiUrl}/status?userId=${userId}`).pipe(
      tap((response: any) => {
        console.log('Auth status response:', response);
        this.isAuthenticatedSubject.next(response.authenticated);
      }),
      catchError(err => {
        console.error('Error checking auth status:', err);
        throw err;
      })
    );
  }

  removeIntegration(): Observable<any> {
    const userId = this.userIdSubject.value;
    return this.http.delete(`${this.apiUrl}/remove?userId=${userId}`).pipe(
      tap(() => {
        if (this.isBrowser) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
        }
        this.userIdSubject.next(null);
        this.isAuthenticatedSubject.next(false);
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
    this.userIdSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  get userId(): string | null {
    return this.userIdSubject.value;
  }

  get token(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }
}
