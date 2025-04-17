import { Routes } from '@angular/router';
import { GithubAuthComponent } from './components/github-auth/github-auth.component';
import { GithubDataComponent } from './components/github-data/github-data.component';
import { GithubIntegrationStatusComponent } from './components/github-integration-status/github-integration-status.component';

export const routes: Routes = [
  { path: '', component: GithubAuthComponent },
  { path: 'data', component: GithubDataComponent },
  { path: 'auth/success', component: GithubIntegrationStatusComponent },
  { path: 'auth/callback', component: GithubIntegrationStatusComponent }, // Add this route
  { path: 'auth/failure', component: GithubAuthComponent },
  { path: '**', redirectTo: '' }
];
