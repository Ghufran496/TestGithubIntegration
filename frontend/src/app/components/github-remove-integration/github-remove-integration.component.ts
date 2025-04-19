import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-github-remove-integration',
  templateUrl: './github-remove-integration.component.html',
  styleUrls: ['./github-remove-integration.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class GithubRemoveIntegrationComponent {
  isRemoving = false;

  constructor(private authService: AuthService, private router: Router) {}

  removeIntegration(): void {
    this.isRemoving = true;
    this.authService.removeIntegration().subscribe({
      next: () => {
        this.isRemoving = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error removing integration:', error);
        this.isRemoving = false;
      },
    });
  }

  cancel(): void {}
}
