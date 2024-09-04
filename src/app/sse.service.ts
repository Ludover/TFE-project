import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { environment } from 'src/environments/environment';

const BACKEND_URL = environment.apiForSSE;

@Injectable()
export class SSEService {
  private eventSource: EventSource;
  private friendRequestSubject = new Subject<any>();
  private movieRecommendedSubject = new Subject<any>();

  constructor(private zone: NgZone) {}

  connect(userId: string) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`${BACKEND_URL}/sse?userId=${userId}`);

    this.eventSource.onmessage = (event) => {
      this.zone.run(() => {
        const data = JSON.parse(event.data);
        if (data.eventType === 'friendRequest') {
          this.friendRequestSubject.next(data.data);
        } else if (data.eventType === 'movieShared') {
          this.movieRecommendedSubject.next(data.data);
        }
      });
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE Error: ', error);
      this.eventSource.close();
    };
  }

  receiveFriendRequest(): Observable<any> {
    return this.friendRequestSubject.asObservable();
  }

  receiveMovieRecommended(): Observable<any> {
    return this.movieRecommendedSubject.asObservable();
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
