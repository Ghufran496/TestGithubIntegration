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
  ],
})
export class GithubDataComponent implements OnInit {
  isLoading = true;
  isSyncing = false;
  collections: any[] = [];
  selectedCollection = 'organizations';
  selectedRepo: string = '';
  selectedOrg: string = '';
  organizations: any[] = [];
  repositories: any[] = [];

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
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const authSub = this.authService.isAuthenticated$
      .pipe(take(1))
      .subscribe((isAuthenticated) => {
        if (!isAuthenticated) {
          this.router.navigate(['/']);
          return;
        }

        const userId = this.authService.userId;
        if (userId) {
          this.authService
            .checkAuthStatus(userId)
            .pipe(take(1))
            .subscribe((status) => {
              this.integrationStatus = status;
              this.loadCollections();
            });
        }
      });

    this.subscriptions.push(authSub);

    const searchSub = this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        this.loadData(1);
      });

    this.subscriptions.push(searchSub);
  }

  ngOnDestroy(): void {
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

    this.githubService
      .getData(this.selectedCollection, page, this.pageSize, search, repo)
      .subscribe({
        next: (response) => {
          // Handle the grouped commits data structure
          if (this.selectedCollection === 'commits') {
            if (repo) {
              // If a specific repo is selected, display commits directly
              this.dataSource.data = response.data;
              
              if (response.data.length > 0) {
                // Add repository name as the first column
                const columns = Object.keys(response.data[0]).filter(
                  (key) => key !== '_id' && key !== '__v' && key !== 'userId'
                );
                
                // Ensure repositoryName is the first column
                this.displayedColumns = [
                  'repositoryName',
                  ...columns.filter(col => col !== 'repositoryName')
                ];
              } else {
                this.displayedColumns = [];
              }
            } else {
              // If no repo is selected, handle the grouped structure
              if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].repository) {
                // Flatten the grouped data for display
                const flattenedData: Array<Record<string, any>> = [];
                response.data.forEach((repoGroup: { repository: string; commits: Array<Record<string, any>> }) => {
                  if (repoGroup.commits && Array.isArray(repoGroup.commits)) {
                    repoGroup.commits.forEach((commit: Record<string, any>) => {
                      flattenedData.push({
                        ...commit,
                        repository: repoGroup.repository
                      });
                    });
                  }
                });
                
                this.dataSource.data = flattenedData;
                
                if (flattenedData.length > 0) {
                  const columns = Object.keys(flattenedData[0]).filter(
                    (key) => key !== '_id' && key !== '__v' && key !== 'userId'
                  );
                  
                  // Ensure repository is the first column
                  this.displayedColumns = [
                    'repository',
                    ...columns.filter(col => col !== 'repository')
                  ];
                } else {
                  this.displayedColumns = [];
                }
              } else {
                // Handle regular data format
                this.dataSource.data = response.data;
                
                if (response.data.length > 0) {
                  this.displayedColumns = Object.keys(response.data[0]).filter(
                    (key) => key !== '_id' && key !== '__v' && key !== 'userId'
                  );
                } else {
                  this.displayedColumns = [];
                }
              }
            }
          } else {
            // For other collections, use the standard approach
            this.dataSource.data = response.data;
            
            if (response.data.length > 0) {
              this.displayedColumns = Object.keys(response.data[0]).filter(
                (key) => key !== '_id' && key !== '__v' && key !== 'userId'
              );
            } else {
              this.displayedColumns = [];
            }
          }
          
          this.totalItems = response.pagination.total;
          this.isLoading = false;

          setTimeout(() => {
            this.dataSource.sort = this.sort;
          });
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.isLoading = false;
        },
      });
  }

  onCollectionChange(): void {
    if (this.paginator) {
      this.paginator.firstPage();
    }

    // Clear the current data to show "No data found" while loading
    this.dataSource.data = [];
    this.displayedColumns = [];
    this.totalItems = 0;

    // Load appropriate data based on selection
    if (this.selectedCollection === 'users') {
      this.loadOrganizations();
      // After loading organizations, check if we have any
      if (this.organizations.length > 0) {
        // Use the first organization if none is selected
        if (!this.selectedOrg) {
          this.selectedOrg = this.organizations[0].login || this.organizations[0].name;
        }
        // Load users data from the database
        this.loadData(1);
      }
    } else if (['commits', 'pulls', 'pull-requests', 'issues'].includes(this.selectedCollection)) {
      this.loadRepositories();
      // After loading repositories, check if we have any
      if (this.repositories.length > 0) {
        // Use the first repository if none is selected
        if (!this.selectedRepo) {
          this.selectedRepo = this.repositories[0].fullName;
        }
        // Load data from the database
        this.loadData(1);
      }
    } else {
      // For organizations and repositories, just load the data
      this.loadData(1);
    }
  }

  loadOrganizations(): void {
    this.isLoading = true;
    this.githubService.getOrganizationsForSelection().subscribe({
      next: (orgs: any[]) => {
        this.organizations = orgs;
        this.isLoading = false;
        if (orgs.length > 0) {
          this.selectedOrg = orgs[0].login || orgs[0].name;
          // Load users data after setting the organization
          this.loadData(1);
        }
      },
      error: (error: any) => {
        console.error('Error loading organizations:', error);
        this.isLoading = false;
      },
    });
  }

  loadRepositories(): void {
    this.isLoading = true;
    this.githubService.getRepositories().subscribe({
      next: (response: any) => {
        this.repositories = response.data || [];
        this.isLoading = false;
        if (this.repositories.length > 0) {
          this.selectedRepo = this.repositories[0].fullName;
          // Load data after setting the repository
          this.loadData(1);
        }
      },
      error: (error: any) => {
        console.error('Error loading repositories:', error);
        this.isLoading = false;
      },
    });
  }

  openOrgSelectorDialog(): void {
    const dialogRef = this.dialog.open(RepoSelectorComponent, {
      width: '400px',
      data: { dataType: 'organizations' },
    });

    dialogRef.afterClosed().subscribe((result) => {
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
      },
    });
  }

  openRepoSelectorDialog(): void {
    const dialogRef = this.dialog.open(RepoSelectorComponent, {
      width: '500px',
      data: { dataType: this.selectedCollection },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedRepo = result;
        this.syncSelectedData();
      } else {
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
            if (
              response &&
              response.message === 'Repository is empty (no commits yet)'
            ) {
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
          },
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
          },
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
          },
        });
        break;
    }
  }

  onRepoSelected(event: any): void {
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
    console.log(
      'Starting sync process for collection:',
      this.selectedCollection
    );

    this.githubService.syncOrganizations().subscribe({
      next: (orgs: any[]) => {
        console.log('Organizations sync response:', orgs);

        if (orgs && orgs.length > 0) {
          console.log(`Found ${orgs.length} organizations`);

          if (this.selectedCollection === 'organizations') {
            this.isSyncing = false;
            this.loadData();
            this.organizations = orgs;
          } else if (this.selectedCollection === 'repositories') {
            const orgName = this.selectedOrg || orgs[0].login || orgs[0].name;
            console.log(
              `Using organization: ${orgName} for syncing repositories`
            );

            this.githubService.syncRepositories(orgName).subscribe({
              next: (repos: any[]) => {
                console.log(`Synced ${repos.length} repositories`);
                this.selectedOrg = orgName; // Save the selected org
                this.isSyncing = false;
                this.loadData();
              },
              error: (error: any) => {
                console.error('Error syncing repositories:', error);
                this.isSyncing = false;
              },
            });
          } else if (this.selectedCollection === 'users') {
            const orgName = this.selectedOrg || orgs[0].login || orgs[0].name;
            console.log(`Using organization: ${orgName} for syncing users`);

            this.githubService.syncUsers(orgName).subscribe({
              next: (users: any[]) => {
                console.log(`Synced ${users ? users.length : 0} users`);
                this.selectedOrg = orgName;
                this.isSyncing = false;
                this.loadData();
              },
              error: (error: any) => {
                console.error('Error syncing users:', error);
                this.isSyncing = false;
              },
            });
          } else if (
            ['commits', 'pulls', 'pull-requests', 'issues'].includes(
              this.selectedCollection
            )
          ) {
            if (!this.selectedRepo) {
              this.loadRepositories();
              this.isSyncing = false;
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
                    console.error(
                      `Error syncing ${this.selectedCollection}:`,
                      error
                    );
                    this.isSyncing = false;
                  },
                });
              } else {
                this.isSyncing = false;
              }
            }
          } else {
            this.isSyncing = false;
            this.loadData();
          }
        } else {
          console.log('No organizations found');
          this.isSyncing = false;
        }
      },
      error: (error: any) => {
        console.error('Error syncing organizations:', error);
        this.isSyncing = false;
      },
    });
  }

  private getSyncMethod():
    | ((owner: string, repo: string) => Observable<any>)
    | null {
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
    const page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData(page);
  }
}
