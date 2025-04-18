import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class GithubService {
  private apiUrl = 'http://localhost:3000/api/github';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Get all available collections
  getCollections(): Observable<any> {
    return this.http.get(`${this.apiUrl}/collections`);
  }

  // Get data for a specific collection
  getData(
    collection: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    repo: string = ''
  ): Observable<any> {
    const userId = this.authService.userId;
    let url = `${this.apiUrl}/data/${collection}?userId=${userId}&page=${page}&limit=${limit}&search=${search}`;
    if (repo) {
      url += `&repo=${repo}`;
    }
    return this.http.get(url);
  }

  // Sync organizations
  syncOrganizations(): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/sync/organizations?userId=${userId}`);
  }

  // Sync repositories for an organization
  syncRepositories(orgName: string): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(
      `${this.apiUrl}/sync/repositories/${orgName}?userId=${userId}`
    );
  }

  // Sync commits for a repository
  syncCommits(owner: string, repo: string): Observable<any> {
    console.log('syncing commits');
    console.log(owner, 'ownereeeeeeee');
    console.log(repo, 'reppppp');

    const userId = this.authService.userId;
    return this.http.get(
      `${this.apiUrl}/sync/commits/${owner}/${repo}?userId=${userId}`
    );
  }

  // Sync pull requests for a repository
  // Sync pull requests for a repository
  syncPulls(owner: string, repo: string): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(
      `${this.apiUrl}/sync/pulls/${owner}/${repo}?userId=${userId}`
    ).pipe(
      catchError((error: any) => {
        console.error(`Error syncing pull requests for ${owner}/${repo}:`, error);
        return of([]);
      })
    );
  }

  // Sync issues for a repository
  syncIssues(owner: string, repo: string): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(
      `${this.apiUrl}/sync/issues/${owner}/${repo}?userId=${userId}`
    ).pipe(
      catchError((error: any) => {
        console.error(`Error syncing issues for ${owner}/${repo}:`, error);
        return of([]);
      })
    );
  }

  // Sync users for an organization
  syncUsers(orgName: string): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(
      `${this.apiUrl}/sync/users/${orgName}?userId=${userId}`
    ).pipe(
      catchError((error: any) => {
        console.error(`Error syncing users for organization ${orgName}:`, error);
        return of([]);
      })
    );
  }

  // Get repositories for the authenticated user
  getRepositories(): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/data/repositories?userId=${userId}`).pipe(
      catchError((error: any) => {
        console.error('Error fetching repositories:', error);
        return of({ data: [] });
      })
    );
  }

  // Get organizations for user selection
  getOrganizationsForSelection(): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/data/organizations?userId=${userId}&page=1&limit=100`).pipe(
      map((response: any) => response.data || []),
      catchError((error: any) => {
        console.error('Error fetching organizations:', error);
        return of([]);
      })
    );
  }

  // Get organizations for the authenticated user
  getOrganizations(): Observable<any> {
    const userId = this.authService.userId;
    return this.http.get(`${this.apiUrl}/data/organizations?userId=${userId}`).pipe(
      catchError((error: any) => {
        console.error('Error fetching organizations:', error);
        return of({ data: [] });
      })
    );
  }


  // syncCommits(owner: string, repo: string): Observable<any> {
  //   const userId = this.authService.userId;
  //   return this.http.get(`${this.apiUrl}/sync/commits/${owner}/${repo}?userId=${userId}`);
  // }

  // syncPullRequests(owner: string, repo: string): Observable<any> {
  //   const userId = this.authService.userId;
  //   return this.http.get(`${this.apiUrl}/sync/pulls/${owner}/${repo}?userId=${userId}`);
  // }

  // syncIssues(owner: string, repo: string): Observable<any> {
  //   const userId = this.authService.userId;
  //   return this.http.get(`${this.apiUrl}/sync/issues/${owner}/${repo}?userId=${userId}`);
  // }


  // Sync all data for a specific organization
  syncAllData(orgName: string): Observable<any>[] {
    const repos$ = this.syncRepositories(orgName);
    const users$ = this.syncUsers(orgName);

    return [repos$, users$];
  }

  // Remove duplicate syncPullRequests method as it's redundant with syncPulls
  syncPullRequests(orgName: string, repoName: string): Observable<any[]> {
    const userId = this.authService.userId;
    return this.http
      .get<any[]>(
        `${this.apiUrl}/sync/pulls/${orgName}/${repoName}?userId=${userId}`
      )
      .pipe(
        catchError((error: any) => {
          console.error(
            `Error syncing pull requests for ${orgName}/${repoName}:`,
            error
          );
          return of([]);
        })
      );
  }
}

