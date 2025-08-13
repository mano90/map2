import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Device } from 'src/app/classes/Device';
import { Observable, of } from 'rxjs';

import { HistoryData, HistoryDataFilter } from 'src/app/classes/HistoryData';
import { Locate } from 'src/app/classes/Locate';
import { environment } from 'src/environments/environment';
import { devicePositions, devices, historyData } from './data';

type ServiceOSRM = 'route' | 'nearest' | 'table' | 'match' | 'trip' | 'tile';
type ProfileOSRM = 'car' | 'bike' | 'foot' | 'driving';

@Injectable({
  providedIn: 'root',
})
export class ApiLocalService {
  getAllDevices(): Observable<Locate[]> {
    return of(devicePositions);
  }

  getOneById(id: number, end?: Date, begin?: Date): Observable<Locate[]> {
    let result = devicePositions.filter((p) => p.device.id === id);
    if (begin) result = result.filter((p) => p.date >= begin);
    if (end) result = result.filter((p) => p.date <= end);
    return of(result);
  }

  getAllRawDevice(): Observable<Device[]> {
    return of(devices);
  }

  activateTrack(deviceNumber: string, duration: number, frequency: number) {
    // Just return a fake response
    return of({ deviceNumber, duration, frequency, tracking: true });
  }

  changeIcon(id: number, data: FormData) {
    const device = devices.find((d) => d.id === id);
    if (device) {
      device.icon = data.get('icon') as string;
    }
    return of(device);
  }

  saveDevice(device: Device) {
    const index = devices.findIndex((d) => d.id === device.id);
    if (index >= 0) devices[index] = device;
    else devices.push(device);
    return of(device);
  }

  getDeviceById(id: number): Observable<Device> {
    const device = devices.find((d) => d.id === id);
    return of(device!);
  }

  updateCoordinates(id: number, limiteHG: string, limiteBD: string) {
    const device = devices.find((d) => d.id === id);
    if (device) {
      device.limiteHG = limiteHG;
      device.limiteBD = limiteBD;
    }
    return of(device);
  }

  updateSeuilMultiple(deviceIds: number[], seuil: number) {
    deviceIds.forEach((id) => {
      const device = devices.find((d) => d.id === id);
      if (device) device.seuil = seuil;
    });
    return of({ success: true });
  }

  getRoute(coordinates: [number, number][], service: string, profile: string) {
    // Return fake route
    return of({ coordinates, service, profile, route: 'fake-polyline' });
  }

  getDevicesByFilter(filter: HistoryDataFilter): Observable<Locate[]> {
    let filtered = devicePositions.filter((p) =>
      filter.status.includes(p.device.status as any)
    );
    if (filter.begin)
      filtered = filtered.filter((p) => p.date >= filter.begin!);
    filtered = filtered.filter((p) => p.date <= filter.end);
    return of(filtered);
  }

  getStatus(deviceNumber: string) {
    const device = devices.find((d) => d.deviceNumber === deviceNumber);
    return of({ deviceNumber, status: device?.status });
  }

  getStatuses(deviceNumbers: number[]) {
    const statusList = devices
      .filter((d) => deviceNumbers.includes(d.id!))
      .map((d) => ({ deviceNumber: d.deviceNumber, status: d.status }));
    return of(statusList);
  }

  getHistoryDataByDeviceId(deviceId: number): Observable<HistoryData[]> {
    const result = historyData.filter((h) => h.device?.id === deviceId);
    return of(result);
  }

  sendStopAlertMessage(deviceNumber: string, alertType: string) {
    return of({ deviceNumber, alertType, stopped: true });
  }

  changePowerStatus(deviceNumber: string, activated: boolean) {
    const device = devices.find((d) => d.deviceNumber === deviceNumber);
    // if (device) device.activated = !activated;
    return of(device);
  }

  deleteDevice(deviceId: number): Observable<any> {
    const index = devices.findIndex((d) => d.id === deviceId);
    if (index >= 0) devices.splice(index, 1);
    return of({ success: true });
  }

  login(name: string, password: string): Observable<any> {
    return of({ name, token: { data: { token: 'fake-jwt-token' } } });
  }

  resetPassword(name: string): Observable<any> {
    return of({ name, reset: true });
  }

  changePassword(
    mail: string,
    oldPassword: string,
    newPassword: string
  ): Observable<any> {
    return of({ mail, changed: true });
  }

  getConfig(): Observable<any> {
    return of({ config1: 1, config2: 2 });
  }

  setConfig(item: string, value: number): Observable<any> {
    return of({ item, value });
  }

  getListLog(): Observable<any> {
    return of([{ id: 1, message: 'Fake log' }]);
  }
}
