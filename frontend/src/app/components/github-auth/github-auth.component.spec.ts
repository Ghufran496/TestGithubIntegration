import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubAuthComponent } from './github-auth.component';

describe('GithubAuthComponent', () => {
  let component: GithubAuthComponent;
  let fixture: ComponentFixture<GithubAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GithubAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GithubAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
