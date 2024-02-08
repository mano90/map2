import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Locate } from 'src/app/classes/Locate';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApicallService {
  private http = inject(HttpClient);

  getAllDevices(): Observable<Locate[]> {
    const url = environment.backUrl + '/device/getAll';
    return this.http.get<Locate[]>(url);
  }
  getOneById(id: number): Observable<Locate[]> {
    const url = environment.backUrl + '/device/getOneById/' + id;
    return this.http.get<Locate[]>(url);
  }
}
