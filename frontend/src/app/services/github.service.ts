import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  private apiUrl = 'http://localhost:3000/api/github';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Get all available collections
  getCollections(): Observable<any> {
    return this.http.get(`${this.apiUrl}/collections`);
  }

  // Get data for a specific collection
  getData(collection: string, page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/data/${collection}?userId=${userId}&page=${page}&limit=${limit}&search=${search}`);
  }

  // Sync organizations
  syncOrganizations(): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/sync/organizations?userId=${userId}`);
  }

  // Sync repositories for an organization
  syncRepositories(orgName: string): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/sync/repositories/${orgName}?userId=${userId}`);
  }

  // Sync commits for a repository
  syncCommits(owner: string, repo: string): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/sync/commits/${owner}/${repo}?userId=${userId}`);
  }

  // Sync pull requests for a repository
  syncPulls(owner: string, repo: string): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/sync/pulls/${owner}/${repo}?userId=${userId}`);
  }

  // Sync issues for a repository
  syncIssues(owner: string, repo: string): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/sync/issues/${owner}/${repo}?userId=${userId}`);
  }

  // Sync users for an organization
  syncUsers(orgName: string): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/sync/users/${orgName}?userId=${userId}`);
  }

  // Sync all data for a specific organization
  syncAllData(orgName: string): Observable<any>[] {
    const repos$ = this.syncRepositories(orgName);
    const users$ = this.syncUsers(orgName);
    
    return [repos$, users$];
  }

  syncPullRequests(orgName: string, repoName: string): Observable<any[]> {
    const userId = this.authService.userId;
    return this.http.get<any[]>(`${this.apiUrl}/sync/pulls/${orgName}/${repoName}?userId=${userId}`).pipe(
      catchError((error: any) => {
        console.error(`Error syncing pull requests for ${orgName}/${repoName}:`, error);
        return of([]);
      })
    );
  }
}
