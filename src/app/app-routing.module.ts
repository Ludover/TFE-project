import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MovieListComponent } from './movies/movie-list/movie-list.component';
import { SignupComponent } from './auth/signup/signup.component';
import { SigninComponent } from './auth/signin/signin.component';
import { SearchComponent } from './movies/search/search.component';
import { MovieListDoneComponent } from './movies/movie-list-done/movie-list-done.component';
import { AuthGuard } from './auth/auth.guard';
import { FriendListComponent } from './friends/list/friend-list.component';
import { AddFriendComponent } from './friends/add friend/add-friend.component';
import { FriendListRequestSentComponent } from './friends/listFriendRequestSent/friend-list-request-sent.component';
import { FriendListRequestReceivedComponent } from './friends/listFriendRequestReceived/friend-list-request-received.component';
import { MovieListRecommendedComponent } from './movies/movie-list-recommended/movie-list-recommended.component';
import { HomeComponent } from './home/home.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  { path: 'search', component: SearchComponent },
  {
    path: 'listtosee',
    canActivate: [AuthGuard],
    component: MovieListComponent,
  },
  {
    path: 'listseen',
    canActivate: [AuthGuard],
    component: MovieListDoneComponent,
  },
  {
    path: 'recommendedlist',
    canActivate: [AuthGuard],
    component: MovieListRecommendedComponent,
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
  {
    path: 'friendrequestSent',
    canActivate: [AuthGuard],
    component: FriendListRequestSentComponent,
  },
  {
    path: 'friendrequestReceived',
    canActivate: [AuthGuard],
    component: FriendListRequestReceivedComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
