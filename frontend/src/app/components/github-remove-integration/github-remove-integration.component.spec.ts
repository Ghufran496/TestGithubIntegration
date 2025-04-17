import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubRemoveIntegrationComponent } from './github-remove-integration.component';

describe('GithubRemoveIntegrationComponent', () => {
  let component: GithubRemoveIntegrationComponent;
  let fixture: ComponentFixture<GithubRemoveIntegrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GithubRemoveIntegrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GithubRemoveIntegrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
