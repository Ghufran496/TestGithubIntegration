import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-github-integration-status',
  templateUrl: './github-integration-status.component.html',
  styleUrls: ['./github-integration-status.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class GithubIntegrationStatusComponent implements OnInit {
  isLoading = true;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('GitHub integration status component initialized');
    this.route.queryParams.subscribe((params) => {
      console.log('Received query params:', params);
      const token = params['token'];
      const userId = params['userId'];

      if (token && userId) {
        this.authService.setAuthState(token, userId, false);
        this.isSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/data']);
        }, 2000);
      } else {
        console.error('Missing token or userId in callback params');
        this.isSuccess = false;
        this.errorMessage = 'Authentication failed. Please try again.';
      }

      this.isLoading = false;
    });
  }
}
