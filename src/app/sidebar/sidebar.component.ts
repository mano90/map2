import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
} from '@angular/forms';

import * as _moment from 'moment';
import { default as _rollupMoment } from 'moment';
import { DeviceStatus } from '../classes/DeviceStatus';
import { ApiLocalService } from '../services/requests/apiLocal.service';
import { Locate } from '../classes/Locate';
import { HistoryDataFilter } from '../classes/HistoryData';
const moment = _rollupMoment || _moment;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  isSidebarOpen = false;

  formGroup = this._formBuilder.group(
    {
      online: true,
      offline: true,
      unknownStatus: true,
      maintenance: new FormControl({ value: '', disabled: true }),
      dateDebut: [],
      dateFin: [moment()],
    },
    {
      validators: [
        this.dateDebutBeforeDateFinValidator,
        this.atLeastOneStatusCheckedValidator,
      ],
    }
  );
  dateDebutBeforeDateFinValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const dateDebut = control.get('dateDebut')!.value;
    const dateFin = control.get('dateFin')!.value;
    if (dateDebut && dateFin && moment(dateDebut).isAfter(dateFin)) {
      return { dateDebutAfterDateFin: true };
    }
    return null;
  }

  private atLeastOneStatusCheckedValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    if (
      control.get('online').value !== true &&
      control.get('offline').value !== true &&
      control.get('unknownStatus').value !== true
    ) {
      return { statusRequired: true };
    }
    return null;
  }

  constructor(
    private _formBuilder: FormBuilder,
    private service: ApiLocalService
  ) {}

  ngOnInit(): void {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
  @Output() messageEvent = new EventEmitter<{
    data: Locate[];
    end: Date;
    begin?: Date;
  }>();

  alertFormValues(formGroup: FormGroup) {
    const statuses: DeviceStatus[] = [];
    let dateFin: Date = new Date();
    if (formGroup.get('online').value) statuses.push(DeviceStatus.ONLINE);
    if (formGroup.get('offline').value) statuses.push(DeviceStatus.OFFLINE);
    if (formGroup.get('unknownStatus').value)
      statuses.push(DeviceStatus.UNKNOWN);
    if (formGroup.get('dateFin'))
      dateFin = new Date(formGroup.get('dateFin').value);
    const filterData: HistoryDataFilter = {
      end: dateFin,
      status: statuses,
    };
    if (formGroup.get('dateDebut')) {
      filterData.begin = new Date(formGroup.get('dateDebut').value);
    }
    this.service.getDevicesByFilter(filterData).subscribe((res) => {
      this.messageEvent.emit({
        data: res,
        end: filterData.end,
        begin: filterData.begin,
      });
      this.isSidebarOpen = !this.isSidebarOpen;
    });
  }
}
