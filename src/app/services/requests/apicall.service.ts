import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Device } from 'src/app/classes/Device';
import { HistoryDataFilter } from 'src/app/classes/HistoryDataFilter';
import { Locate } from 'src/app/classes/Locate';
import { environment } from 'src/environments/environment';
type ServiceOSRM = 'route' | 'nearest' | 'table' | 'match' | 'trip' | 'tile';
type ProfileOSRM = 'car' | 'bike' | 'foot' | 'driving';
@Injectable({
  providedIn: 'root',
})
export class ApicallService {
  private http = inject(HttpClient);

  getAllDevices(): Observable<Locate[]> {
    const url = environment.backUrl + '/device/getAll';
    return this.http.get<Locate[]>(url);
  }
  getOneById(id: number, end: Date, begin?: Date): Observable<Locate[]> {
    let url = environment.backUrl + '/device/getOneById/' + id;
    if (end) {
      url += '/' + end;
    }
    if (begin) {
      url += '/' + begin;
    }
    return this.http.get<Locate[]>(url);
  }

  getAllRawDevice(): Observable<Device[]> {
    const url = environment.backUrl + '/device/getAllRaw';
    return this.http.get<Device[]>(url);
  }

  changeIcon(id: number, data: FormData) {
    const url = environment.backUrl + '/device/changeIcon/' + id;
    return this.http.post<any[]>(url, data);
  }
  saveDevice(device: Device) {
    const url = environment.backUrl + '/device/save';
    return this.http.post<any[]>(url, device);
  }

  getDeviceById(id: number): Observable<Device> {
    const url = environment.backUrl + '/device/getRawOneById/' + id;
    return this.http.get<Device>(url);
  }
  updateCoordinates(id: number, limiteHG: string, limiteBD: string) {
    const data = {
      limiteHG,
      limiteBD,
    };
    const url = environment.backUrl + '/device/updateCoordinates/' + id;
    return this.http.post<any[]>(url, data);
  }

  updateSeuilMultiple(ids: number[], seuil: number) {
    const url = environment.backUrl + '/device/updateMultipleSeuil';
    return this.http.post<any[]>(url, { ids, seuil });
  }

  getRoute(
    coordinates: [number, number][],
    service: ServiceOSRM,
    profile: ProfileOSRM
  ) {
    const url = `http://router.project-osrm.org/${service}/v1/${profile}/${coordinates.join(
      ';'
    )}?overview=full&geometries=polyline6`;
    return this.http.get(url);
  }

  getDevicesByFilter(data: HistoryDataFilter): Observable<Locate[]> {
    const url = environment.backUrl + '/history/getByFilter';
    return this.http.post<Locate[]>(url, data);
  }
  getStatus(id: number) {
    const url = environment.backUrl + '/message/checkStatus/' + id;
    return this.http.get<any>(url);
  }
  getStatuses(phoneNumbers: number[]) {
    const url = environment.backUrl + '/message/checkStatuses/';
    return this.http.post<any>(url, { phoneNumbers });
  }
}
