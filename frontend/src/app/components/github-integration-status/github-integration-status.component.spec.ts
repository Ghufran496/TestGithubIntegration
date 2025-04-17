import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubIntegrationStatusComponent } from './github-integration-status.component';

describe('GithubIntegrationStatusComponent', () => {
  let component: GithubIntegrationStatusComponent;
  let fixture: ComponentFixture<GithubIntegrationStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GithubIntegrationStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GithubIntegrationStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
