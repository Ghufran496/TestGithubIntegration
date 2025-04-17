import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-github-auth',
  templateUrl: './github-auth.component.html',
  styleUrls: ['./github-auth.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class GithubAuthComponent implements OnInit {
  isAuthenticated = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      this.isAuthenticated = isAuthenticated;
      if (isAuthenticated) {
        this.router.navigate(['/data']);
      }
    });
  }

  connectToGithub(): void {
    this.authService.initiateGithubAuth();
  }
}
