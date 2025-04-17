import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';

// Angular Material Imports
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
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';

// Components
import { AppComponent } from './app.component';
import { GithubAuthComponent } from './components/github-auth/github-auth.component';
import { GithubDataComponent } from './components/github-data/github-data.component';
import { GithubIntegrationStatusComponent } from './components/github-integration-status/github-integration-status.component';
import { GithubRemoveIntegrationComponent } from './components/github-remove-integration/github-remove-integration.component';

// Services
import { GithubService } from './services/github.service';
import { AuthService } from './services/auth.service';

const routes: Routes = [
  { path: '', component: GithubAuthComponent },
  { path: 'data', component: GithubDataComponent },
  { path: 'auth/success', component: GithubIntegrationStatusComponent },
  { path: 'auth/failure', component: GithubAuthComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    GithubAuthComponent,
    GithubDataComponent,
    GithubIntegrationStatusComponent,
    GithubRemoveIntegrationComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
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
    MatBadgeModule,
    MatChipsModule
  ],
  providers: [
    GithubService,
    AuthService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }