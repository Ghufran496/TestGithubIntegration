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
import { Subscription } from 'rxjs';

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
    GithubRemoveIntegrationComponent
  ]
})
export class GithubDataComponent implements OnInit, OnDestroy {
  isLoading = true;
  isSyncing = false;
  collections: any[] = [];
  selectedCollection = 'organizations';
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
    private router: Router
  ) { }

  ngOnInit(): void {
    // Single subscription to handle authentication
    const authSub = this.authService.isAuthenticated$.pipe(take(1)).subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.router.navigate(['/']);
        return;
      }
      
      // Get integration status once
      const userId = this.authService.userId;
      if (userId) {
        this.authService.checkAuthStatus(userId).pipe(take(1)).subscribe(status => {
          this.integrationStatus = status;
          
          // Load collections after authentication is confirmed
          this.loadCollections();
        });
      }
    });
    
    this.subscriptions.push(authSub);
    
    // Set up search with subscription management
    const searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(value => {
      this.loadData(1);
    });
    
    this.subscriptions.push(searchSub);
  }
  
  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
      }
    });
  }

  loadData(page: number = 1): void {
    this.isLoading = true;
    const search = this.searchControl.value || '';
    
    this.githubService.getData(this.selectedCollection, page, this.pageSize, search).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalItems = response.pagination.total;
        
        // Dynamically set columns based on the first item
        if (response.data.length > 0) {
          this.displayedColumns = Object.keys(response.data[0])
            .filter(key => key !== '_id' && key !== '__v' && key !== 'userId');
        } else {
          this.displayedColumns = [];
        }
        
        this.isLoading = false;
        
        // Set up sorting and pagination
        setTimeout(() => {
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
        });
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
      }
    });
  }

  onCollectionChange(): void {
    this.loadData(1);
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    this.loadData(event.pageIndex + 1);
  }

  syncData(): void {
    this.isSyncing = true;
    console.log('Starting sync process for collection:', this.selectedCollection);
    
    // First, always sync organizations
    this.githubService.syncOrganizations().subscribe(
      (orgs: any[]) => {
        console.log('Organizations sync response:', orgs);
        
        if (orgs && orgs.length > 0) {
          console.log(`Found ${orgs.length} organizations`);
          
          if (this.selectedCollection === 'organizations') {
            // If we're just looking at organizations, we're done
            this.isSyncing = false;
            this.loadData();
          } else {
            // For other collections, we need to sync that specific data
            const orgName = orgs[0].login || orgs[0].name;
            console.log(`Using organization: ${orgName} for further syncing`);
            
            if (this.selectedCollection === 'repositories') {
              this.githubService.syncRepositories(orgName).subscribe(
                (repos: any[]) => {
                  console.log(`Synced ${repos.length} repositories`);
                  this.isSyncing = false;
                  this.loadData();
                },
                (error: any) => {
                  console.error('Error syncing repositories:', error);
                  this.isSyncing = false;
                }
              );
            } else if (this.selectedCollection === 'users') {
              this.githubService.syncUsers(orgName).subscribe(
                (users: any[]) => {
                  console.log(`Synced ${users.length} users`);
                  this.isSyncing = false;
                  this.loadData();
                },
                (error: any) => {
                  console.error('Error syncing users:', error);
                  this.isSyncing = false;
                }
              );
            } else {
              // For commits, PRs, issues, we need to get repositories first
              this.githubService.syncRepositories(orgName).subscribe(
                (repos: any[]) => {
                  if (repos.length > 0) {
                    console.log(`Found ${repos.length} repositories, syncing ${this.selectedCollection}`);
                    const repo = repos[0];
                    const repoName = repo.name;
                    
                    if (this.selectedCollection === 'commits') {
                      this.githubService.syncCommits(orgName, repoName).subscribe(
                        (commits: any[]) => {
                          console.log(`Synced ${commits.length} commits`);
                          this.isSyncing = false;
                          this.loadData();
                        },
                        (error: any) => {
                          console.error('Error syncing commits:', error);
                          this.isSyncing = false;
                        }
                      );
                    } else if (this.selectedCollection === 'pull-requests') {
                      this.githubService.syncPulls(orgName, repoName).subscribe(
                        (prs: any[]) => {
                          console.log(`Synced ${prs.length} pull requests`);
                          this.isSyncing = false;
                          this.loadData();
                        },
                        (error: any) => {
                          console.error('Error syncing pull requests:', error);
                          this.isSyncing = false;
                        }
                      );
                    } else if (this.selectedCollection === 'issues') {
                      this.githubService.syncIssues(orgName, repoName).subscribe(
                        (issues: any[]) => {
                          console.log(`Synced ${issues.length} issues`);
                          this.isSyncing = false;
                          this.loadData();
                        },
                        (error: any) => {
                          console.error('Error syncing issues:', error);
                          this.isSyncing = false;
                        }
                      );
                    } else {
                      this.isSyncing = false;
                      this.loadData();
                    }
                  } else {
                    console.warn('No repositories found for organization:', orgName);
                    this.isSyncing = false;
                    alert(`No repositories found for organization ${orgName}. Please create a repository in this organization.`);
                  }
                },
                (error: any) => {
                  console.error('Error syncing repositories:', error);
                  this.isSyncing = false;
                }
              );
            }
          }
        } else {
          // This is the part that had syntax errors
          console.warn('No organizations found after sync');
          this.isSyncing = false;
          alert('No organizations found. Please make sure you have at least one organization in your GitHub account.');
        }
      },
      (error: any) => {
        console.error('Error syncing organizations:', error);
        this.isSyncing = false;
      }
    );
  }
}
