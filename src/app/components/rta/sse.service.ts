import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SseService {
  getEventeSource(url: string): EventSource {
    return new EventSource(url);
  }
}
