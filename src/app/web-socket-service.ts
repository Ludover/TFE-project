import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable()
export class SocketService {
  constructor(private socket: Socket, private authService: AuthService) {}

  connect() {
    this.socket.ioSocket.io.opts.query = { userId: this.authService.getUserId}; // Mettre à jour le userId dans les options
    this.socket.connect(); // Reconnecter avec la nouvelle configuration
  }

  disconnect() {
    this.socket.disconnect();
  }

  emitFriendRequest(request: any) {
    this.socket.emit('friendRequest', request);
  }

  receiveFriendRequest(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('friendRequest', (request: any) => {
        observer.next(request);
      });
    });
  }

  emitMovieRecommended(movie: any) {
    this.socket.emit('movieRecommended', movie);
  }

  receiveMovieRecommended(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('movieRecommended', (movie: any) => {
        observer.next(movie);
      });
    });
  }
}
