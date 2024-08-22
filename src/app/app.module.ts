import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
} from '@angular/common/http';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './header/header.component';
import { MovieListComponent } from './movies/movie-list/movie-list.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from './auth/auth-interceptor';
import { ErrorInterceptor } from './error-interceptor';
import { SignupComponent } from './auth/signup/signup.component';
import { SigninComponent } from './auth/signin/signin.component';
import { SearchComponent } from './movies/search/search.component';
import { MovieListDoneComponent } from './movies/movie-list-done/movie-list-done.component';
import { AddFriendComponent } from './friends/add friend/add-friend.component';
import { FriendListComponent } from './friends/list/friend-list.component';
import { FriendListRequestSentComponent } from './friends/listFriendRequestSent/friend-list-request-sent.component';
import { FriendListRequestReceivedComponent } from './friends/listFriendRequestReceived/friend-list-request-received.component';
import { ShareMovieDialogComponent } from './movies/share-movie-dialog/share-movie-dialog.component';
import { MovieListRecommendedComponent } from './movies/movie-list-recommended/movie-list-recommended.component';
import { MovieDetailsDialogComponent } from './movies/movie-details-dialog/movie-details-dialog.component';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { AngularMaterialModule } from './angular-material-module';

registerLocaleData(localeFr);

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MovieListComponent,
    MovieListDoneComponent,
    SignupComponent,
    SigninComponent,
    SearchComponent,
    AddFriendComponent,
    FriendListComponent,
    FriendListRequestSentComponent,
    FriendListRequestReceivedComponent,
    ShareMovieDialogComponent,
    MovieListRecommendedComponent,
    MovieDetailsDialogComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AngularMaterialModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    DatePipe,
    { provide: LOCALE_ID, useValue: 'fr-BE' },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
