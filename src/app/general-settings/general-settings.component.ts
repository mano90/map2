import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import Swal from 'sweetalert2';

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD-MM-YYYY',
    monthYearLabel: 'MM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MM YYYY',
  },
};
import { MatTableDataSource } from '@angular/material/table';

import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';

import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatSlideToggleModule,
  _MatSlideToggleRequiredValidatorModule,
} from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HttpClientModule } from '@angular/common/http';
import { ApicallService } from '../services/requests/apicall.service';
import { Device } from '../classes/Device';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditDeviceComponent } from '../modals/edit-device/edit-device.component';
import { NotificationService } from '../services/notification/notification.service';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    _MatSlideToggleRequiredValidatorModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatTableModule,
    MatMenuModule,
    RouterModule,
    MatIconModule,
    MatCardModule,
    HttpClientModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
  ],
})
export class GeneralSettingsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns: string[] = [
    'checkbox',
    'id',
    'icon',
    'name',
    'deviceNumber',
    'seuil',
    'status',
    'action',
  ];
  isSimpleAdd: boolean = false;
  columnsToDisplay: string[] = [
    'checkbox',
    'id',
    'icon',
    'name',
    'deviceNumber',
    'seuil',
    'status',
  ];
  dataSource: MatTableDataSource<Device>;
  clickedRows = new Set<number>();
  constructor(
    private service: ApicallService,
    private notificationService: NotificationService,
    public dialog: MatDialog
  ) {}

  alertFormValues(formGroup: FormGroup) {
    alert(JSON.stringify(formGroup.value, null, 2));
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  ngOnInit(): void {
    this.getAllDevice();
  }

  addRow(id: number) {
    if (!this.isSimpleAdd) {
      if (this.clickedRows.has(id)) {
        this.clickedRows.delete(id);
      } else this.clickedRows.add(id);
    }
  }

  getAllDevice() {
    this.service.getAllRawDevice().subscribe((res) => {
      console.log(res);
      this.dataSource = new MatTableDataSource(res);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  simpleSelection() {
    this.isSimpleAdd = !this.isSimpleAdd;
    this.columnsToDisplay.shift();
    this.columnsToDisplay.push(
      this.displayedColumns[this.displayedColumns.length - 1]
    );
    this.clickedRows.clear();
  }

  multipleSelection() {
    this.isSimpleAdd = !this.isSimpleAdd;
    this.columnsToDisplay.pop();
    this.columnsToDisplay.unshift(this.displayedColumns[0]);
  }
  editDevice(device: Device) {
    const dialogRef = this.dialog.open(EditDeviceComponent, {
      data: { device, edit: true },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.getAllDevice();
      }
    });
  }

  async changeIcon(deviceId: number) {
    const { value: file } = await Swal.fire({
      title: "Changer l'icone",
      input: 'file',
      inputAttributes: {
        accept: 'image/*',
      },
    });

    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      this.service.changeIcon(deviceId, formData).subscribe(() => {
        this.getAllDevice();
        this.notificationService.autoClose('success', 'Modifié');
      });
    }
  }

  changeStatusMultiple() {
    const ids = Array.from(this.clickedRows.values());
    this.notificationService.input().then((response) => {
      this.service.updateSeuilMultiple(ids, +response.value).subscribe(() => {
        this.getAllDevice();
        this.notificationService.autoClose('success', 'Modifié');
      });
    });
  }
  chekStatusMultiple() {
    const ids = Array.from(this.clickedRows.values());
    this.service.getStatuses(ids).subscribe((res) => console.log(res));
  }

  checkStatus(id: number) {
    this.service.getStatus(id).subscribe((res) => console.log(res));
  }
}
