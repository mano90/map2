import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import Swal from 'sweetalert2';
import { Socket } from 'ngx-socket-io';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

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
import { ApicallService } from '../services/requests/apicall.service';
import { Device } from '../classes/Device';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditDeviceComponent } from '../modals/edit-device/edit-device.component';
import { NotificationService } from '../services/notification/notification.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { DeviceStatus } from '../classes/DeviceStatus';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
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
export class SettingsComponent {
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
  dataSource: MatTableDataSource<Device>;
  private socketChanges$: Subject<void> = new Subject<void>();
  private onDestroy$: Subject<void> = new Subject<void>();

  constructor(
    private service: ApicallService,
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

    // this.socketChanges$
    //   .pipe(debounceTime(1000), takeUntil(this.onDestroy$))
    //   .subscribe(() => {
    //     this.getAllDevice();
    //     this.spinner.hide();
    //   });

    // this.socket.on('reloadDeviceList', () => {
    //   this.spinner.show();
    //   this.socketChanges$.next();
    // });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
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

  redirectMap() {
    this.router.navigate(['/']);
  }
}
