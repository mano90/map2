import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Device } from 'src/app/classes/Device';
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
  updateCoordinates(
    id: number,
    limiteHG: string,
    limiteHD: string,
    limiteBD: string,
    limiteBG: string
  ) {
    const data = {
      limiteHG,
      limiteHD,
      limiteBD,
      limiteBG,
    };
    const url = environment.backUrl + '/device/updateCoordinates/' + id;
    return this.http.post<any[]>(url, data);
  }
}
