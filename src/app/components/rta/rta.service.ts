import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { Locate } from 'src/app/classes/locate';
import { SseService } from './sse.service';

@Injectable({
  providedIn: 'root',
})
export class RtaService {
  constructor(
    private _zone: NgZone,
    private _sseService: SseService,
    private http: HttpClient
  ) {}
  getServerSentEvent(url: string) {
    return Observable.create((observer) => {
      const eventSource = this._sseService.getEventeSource(url);
      eventSource.onmessage = (event) => {
        this._zone.run(() => {
          observer.next(event);
        });
      };
      eventSource.onerror = (error) => {
        this._zone.run(() => {
          observer.console.error(error);
        });
      };
    });
  }

  getListeLocalisation(): Observable<Locate[]> {
    const url = 'http://localhost:3000/api/locate/liste';
    return this.http.get<Locate[]>(url);
  }

  getItemsById(nombre: number[]): Observable<Locate[]> {
    const data = {
      nombre: nombre,
    };
    const url = 'http://localhost:3000/api/locate/getById';
    return this.http.post<Locate[]>(url, data);
  }
}
