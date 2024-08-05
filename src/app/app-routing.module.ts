import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MovieListComponent } from './review/movie-list/movie-list.component';
import { MovieCreateComponent } from './review/movie-create/movie-create.component';
import { SignupComponent } from './Auth/signup/signup.component';
import { SigninComponent } from './Auth/signin/signin.component';
import { SearchComponent } from './movies/search/search.component';
import { MovieListDoneComponent } from './review/movie-list-done/movie-list-done.component';
import { AuthGuard } from './Auth/auth.guard';
import { FriendListComponent } from './friends/list/friend-list.component';
import { AddFriendComponent } from './friends/add friend/add-friend.component';

const routes: Routes = [
  { path: '', canActivate: [AuthGuard], component: MovieListComponent },
  { path: 'create', canActivate: [AuthGuard], component: MovieCreateComponent },
  {
    path: 'edit/:movieId',
    canActivate: [AuthGuard],
    component: MovieCreateComponent,
  },
  { path: 'signup', component: SignupComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'search', component: SearchComponent },
  { path: 'listVoir', canActivate: [AuthGuard], component: MovieListComponent },
  {
    path: 'listVu',
    canActivate: [AuthGuard],
    component: MovieListDoneComponent,
  },
  {
    path: 'friendlist',
    canActivate: [AuthGuard],
    component: FriendListComponent,
  },
  {
    path: 'addfriend',
    canActivate: [AuthGuard],
    component: AddFriendComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
