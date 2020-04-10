import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BallsComponent } from './balls.component';

describe('BallsComponent', () => {
  let component: BallsComponent;
  let fixture: ComponentFixture<BallsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BallsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BallsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
