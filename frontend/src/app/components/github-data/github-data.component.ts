import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { GithubService } from '../../services/github.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatToolbarModule } from '@angular/material/toolbar';
import { GithubRemoveIntegrationComponent } from '../github-remove-integration/github-remove-integration.component';
import { Observable, Subscription } from 'rxjs';
import { RepoSelectorComponent } from '../repo-selector/repo-selector.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-github-data',
  templateUrl: './github-data.component.html',
  styleUrls: ['./github-data.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatToolbarModule,
    GithubRemoveIntegrationComponent,
    RepoSelectorComponent,
  ],
})
export class GithubDataComponent implements OnInit {
  isLoading = true;
  isSyncing = false;
  collections: any[] = [];
  selectedCollection = 'organizations';
  selectedRepo: string = '';
  selectedOrg: string = ''; // Add this property
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  totalItems = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  searchControl = new FormControl('');
  integrationStatus: any = null;

  private subscriptions: Subscription[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private githubService: GithubService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog  // Add this
  ) {}

  ngOnInit(): void {
    // Single subscription to handle authentication
    const authSub = this.authService.isAuthenticated$
      .pipe(take(1))
      .subscribe((isAuthenticated) => {
        if (!isAuthenticated) {
          this.router.navigate(['/']);
          return;
        }

        // Get integration status once
        const userId = this.authService.userId;
        if (userId) {
          this.authService
            .checkAuthStatus(userId)
            .pipe(take(1))
            .subscribe((status) => {
              this.integrationStatus = status;

              // Load collections after authentication is confirmed
              this.loadCollections();
            });
        }
      });

    this.subscriptions.push(authSub);

    // Set up search with subscription management
    const searchSub = this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        this.loadData(1);
      });

    this.subscriptions.push(searchSub);
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadCollections(): void {
    this.isLoading = true;
    this.githubService.getCollections().subscribe({
      next: (collections) => {
        this.collections = collections;
        this.loadData();
      },
      error: (error) => {
        console.error('Error loading collections:', error);
        this.isLoading = false;
      },
    });
  }

  loadData(page: number = 1): void {
    this.isLoading = true;
    const search = this.searchControl.value || '';
    let repo = '';
    if (
      this.selectedCollection === 'commits' ||
      this.selectedCollection === 'pull-requests' ||
      this.selectedCollection === 'issues'
    ) {
      repo = this.selectedRepo;
    }
    
    console.log('Loading page:', page); // Add this for debugging
    
    this.githubService
      .getData(this.selectedCollection, page, this.pageSize, search, repo)
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data;
          this.totalItems = response.pagination.total;
  
          // Dynamically set columns based on the first item
          if (response.data.length > 0) {
            this.displayedColumns = Object.keys(response.data[0]).filter(
              (key) => key !== '_id' && key !== '__v' && key !== 'userId'
            );
          } else {
            this.displayedColumns = [];
          }
  
          this.isLoading = false;
  
          // Set up sorting and pagination
          setTimeout(() => {
            this.dataSource.sort = this.sort;
            // Don't set paginator here as it will reset the page
          });
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.isLoading = false;
        },
      });
  }

  onCollectionChange(): void {
    // Reset pagination
    if (this.paginator) {
      this.paginator.firstPage();
    }

    // Show organization selector for users
    if (this.selectedCollection === 'users') {
      this.openOrgSelectorDialog();
    } else if (['commits', 'pulls', 'pull-requests', 'issues'].includes(this.selectedCollection)) {
      this.openRepoSelectorDialog();
    } else {
      this.loadData(1);
    }
  }

  openOrgSelectorDialog(): void {
    const dialogRef = this.dialog.open(RepoSelectorComponent, {
      width: '400px',
      data: { dataType: 'organizations' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedOrg = result;
        this.syncUsers(result);
      }
    });
  }

  syncUsers(orgName: string): void {
    this.isSyncing = true;
    this.githubService.syncUsers(orgName).subscribe({
      next: (response: any) => {
        this.isSyncing = false;
        this.loadData(1);
      },
      error: (error: any) => {
        console.error('Error syncing users:', error);
        this.isSyncing = false;
      }
    });
  }

  openRepoSelectorDialog(): void {
    const dialogRef = this.dialog.open(RepoSelectorComponent, {
      width: '500px',
      data: { dataType: this.selectedCollection }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedRepo = result;
        this.syncSelectedData();
      } else {
        // User canceled, reset collection selection
        this.selectedCollection = 'organizations';
      }
    });
  }

  syncSelectedData(): void {
    this.isSyncing = true;
    const orgName = this.selectedRepo.split('/')[0];
    const repoName = this.selectedRepo.split('/')[1];
  
    switch (this.selectedCollection) {
      case 'commits':
        this.githubService.syncCommits(orgName, repoName).subscribe({
          next: (response) => {
            this.isSyncing = false;
            if (response && response.message === 'Repository is empty (no commits yet)') {
              this.dataSource.data = [];
              this.displayedColumns = [];
              this.totalItems = 0;
            } else {
              this.loadData(1);
            }
          },
          error: (error) => {
            console.error('Error syncing commits:', error);
            this.isSyncing = false;
            this.dataSource.data = [];
            this.displayedColumns = [];
            this.totalItems = 0;
          }
        });
        break;
  
      case 'pulls':
      case 'pull-requests':
        this.githubService.syncPulls(orgName, repoName).subscribe({
          next: (response) => {
            this.isSyncing = false;
            if (response && response.length === 0) {
              this.dataSource.data = [];
              this.displayedColumns = [];
              this.totalItems = 0;
            } else {
              this.loadData(1);
            }
          },
          error: (error) => {
            console.error('Error syncing pull requests:', error);
            this.isSyncing = false;
            this.dataSource.data = [];
            this.displayedColumns = [];
            this.totalItems = 0;
          }
        });
        break;
  
      case 'issues':
        this.githubService.syncIssues(orgName, repoName).subscribe({
          next: (response: any) => {
            this.isSyncing = false;
            if (response && response.length === 0) {
              this.dataSource.data = [];
              this.displayedColumns = [];
              this.totalItems = 0;
            } else {
              this.loadData(1);
            }
          },
          error: (error: any) => {
            console.error('Error syncing issues:', error);
            this.isSyncing = false;
            this.dataSource.data = [];
            this.displayedColumns = [];
            this.totalItems = 0;
          }
        });
        break;
    }
  }

  onRepoSelected(event: any): void {  // Change parameter type from string to any
    if (typeof event === 'string') {
      this.selectedRepo = event;
    } else if (event && event.target && event.target.value) {
      this.selectedRepo = event.target.value;
    }
    this.loadData();
  }

  syncData(): void {
    if (!this.selectedCollection) return;

    this.isSyncing = true;
    if (this.selectedCollection === 'organizations') {
      this.githubService.syncOrganizations().subscribe({
        next: () => {
          this.loadData();
          this.isSyncing = false;
        },
        error: (error) => {
          console.error('Error syncing organizations:', error);
          this.isSyncing = false;
        }
      });
    } else if (['commits', 'pulls', 'issues'].includes(this.selectedCollection)) {
      if (!this.selectedRepo) {
        this.openRepoSelectorDialog();
      } else {
        const [owner, repo] = this.selectedRepo.split('/');
        const syncMethod = this.getSyncMethod();
        if (syncMethod) {
          syncMethod(owner, repo).subscribe({
            next: () => {
              this.loadData();
              this.isSyncing = false;
            },
            error: (error) => {
              console.error(`Error syncing ${this.selectedCollection}:`, error);
              this.isSyncing = false;
            }
          });
        }
      }
    }
  }

  private getSyncMethod(): ((owner: string, repo: string) => Observable<any>) | null {
    switch (this.selectedCollection) {
      case 'commits':
        return this.githubService.syncCommits.bind(this.githubService);
      case 'pulls':
        return this.githubService.syncPulls.bind(this.githubService);
      case 'issues':
        return this.githubService.syncIssues.bind(this.githubService);
      default:
        return null;
    }
  }

  onPageChange(event: any): void {
    const page = event.pageIndex + 1; // Convert zero-based index to one-based page number
    this.pageSize = event.pageSize;
    this.loadData(page); // Pass the page number to loadData
  }
}
