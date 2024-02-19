import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';

import * as _moment from 'moment';
import { default as _rollupMoment } from 'moment';
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
      offline: '',
      maintenance: '',
      dateDebut: [moment()],
      dateFin: [moment()],
    },
    { validator: this.dateDebutBeforeDateFinValidator }
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
  constructor(private _formBuilder: FormBuilder) {}

  ngOnInit(): void {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
  @Output() messageEvent = new EventEmitter<string>();

  sendMessage() {
    this.messageEvent.emit('Message from Child');
  }

  alertFormValues(formGroup: FormGroup) {
    alert(JSON.stringify(formGroup.value, null, 2));
  }
}
