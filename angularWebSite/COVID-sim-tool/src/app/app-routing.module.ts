import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BallsComponent } from './balls/balls.component';

const routes: Routes = [
{path: 'balls', component: BallsComponent},
{path: '', redirectTo: 'balls', pathMatch: 'full'}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
