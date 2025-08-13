import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import Swal from 'sweetalert2';
import { Socket } from 'ngx-socket-io';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

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
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HttpClientModule } from '@angular/common/http';
import { ApiLocalService } from '../services/requests/apiLocal.service';
import { Device } from '../classes/Device';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditDeviceComponent } from '../modals/edit-device/edit-device.component';
import { NotificationService } from '../services/notification/notification.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { DeviceStatus } from '../classes/DeviceStatus';

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
    NgxSpinnerModule,
  ],
})
export class GeneralSettingsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  NEEDCONFIRMATION = DeviceStatus.NEEDCONFIRMATION;

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
  clickedRows = new Set<string>();
  private socketChanges$: Subject<void> = new Subject<void>();
  private onDestroy$: Subject<void> = new Subject<void>();

  constructor(
    private service: ApiLocalService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private socket: Socket,
    private router: Router
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
    this.socket.connect();
    this.getAllDevice();

    this.socketChanges$
      .pipe(debounceTime(1000), takeUntil(this.onDestroy$))
      .subscribe(() => {
        this.getAllDevice();
        this.spinner.hide();
      });

    this.socket.on('reloadDeviceList', () => {
      this.spinner.show();
      this.socketChanges$.next();
    });
  }

  addRow(deviceNumber: string) {
    if (!this.isSimpleAdd) {
      if (this.clickedRows.has(deviceNumber)) {
        this.clickedRows.delete(deviceNumber);
      } else this.clickedRows.add(deviceNumber);
    }
  }

  getAllDevice() {
    this.service.getAllRawDevice().subscribe((res) => {
      this.dataSource = new MatTableDataSource(res);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  activateTrack(deviceNumber: string) {
    this.notificationService.customInput().then((response) => {
      if (response !== 0) {
        this.service
          .activateTrack(deviceNumber, response.duration, response.frequency)
          .subscribe((res) => {
            this.getAllDevice();
          });
      }
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

  createDevice() {
    const dialogRef = this.dialog.open(EditDeviceComponent, {
      data: { edit: false },
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
        this.notificationService.autoClose('success', 'Modifié');
        this.getAllDevice();
      });
    }
  }

  changePowerStatus(deviceNumber: string, activated: boolean) {
    const text = activated
      ? 'Etes vous sur de vouloir désactiver'
      : 'Etes vous sur de vouloir activer';
    this.notificationService.confirm(text).then((response) => {
      if (response.isConfirmed) {
        this.service
          .changePowerStatus(deviceNumber, activated)
          .subscribe((res) => {
            console.log(res);
          });
      }
    });
  }
  changeStatusMultiple() {
    const deviceNumbers = Array.from(this.clickedRows.values()).map(Number);
    this.notificationService.input().then((response) => {
      this.service
        .updateSeuilMultiple(deviceNumbers, +response.value)
        .subscribe(() => {
          this.getAllDevice();
          this.clickedRows.clear();
          this.notificationService.autoClose('success', 'Modifié');
        });
    });
  }
  chekStatusMultiple() {
    const deviceNumbers = Array.from(this.clickedRows.values()).map(Number);
    this.service
      .getStatuses(deviceNumbers)
      .subscribe(() => this.clickedRows.clear());
  }

  checkStatus(deviceNumber: string) {
    this.service.getStatus(deviceNumber).subscribe((res) => console.log(res));
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  deleteDevice(deviceId: number) {
    this.notificationService
      .confirm('Etes vous sur de vouloir supprimer')
      .then((response) => {
        if (response.isConfirmed) {
          this.service.deleteDevice(deviceId).subscribe((res) => {
            this.notificationService.success('Supprimé');
            this.getAllDevice();
          });
        }
      });
  }

  redirectMap() {
    this.router.navigate(['/']);
  }

  deconnexion() {
    this.notificationService
      .confirm('Etes vous sur de vouloir vous déconnecter')
      .then((response) => {
        if (response.isConfirmed) {
          localStorage.clear();
          this.router.navigate(['/']);
        }
      });
  }
}
