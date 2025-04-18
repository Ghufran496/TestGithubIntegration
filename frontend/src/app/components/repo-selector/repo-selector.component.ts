import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GithubService } from '../../services/github.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-repo-selector',
  template: `
    <h2 mat-dialog-title>Select Repository</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" style="width: 100%">
        <mat-label>Repository</mat-label>
        <mat-select [(ngModel)]="selectedRepo">
          <mat-option *ngFor="let repo of repos" [value]="repo.fullName">
            {{ repo.fullName }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button color="primary" [disabled]="!selectedRepo" (click)="onSelect()">Select</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule
  ]
})
export class RepoSelectorComponent implements OnInit {
  repos: any[] = [];
  selectedRepo: string = '';

  constructor(
    private githubService: GithubService,
    public dialogRef: MatDialogRef<RepoSelectorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { dataType: string }
  ) {}

  ngOnInit(): void {
    if (this.data?.dataType === 'organizations') {
      this.githubService.getOrganizationsForSelection().subscribe({
        next: (orgs: any[]) => {
          this.repos = orgs.map((org: any) => ({
            fullName: org.name,
            name: org.name
          }));
        },
        error: (error: any) => {
          console.error('Error loading organizations:', error);
        }
      });
    } else {
      this.githubService.getRepositories().subscribe({
        next: (response: any) => {
          this.repos = response.data || [];
        },
        error: (error: any) => {
          console.error('Error loading repositories:', error);
        }
      });
    }
  }

  onSelect(): void {
    this.dialogRef.close(this.selectedRepo);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
