import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { ApiLocalService } from '../services/requests/apiLocal.service';
import { Device } from '../classes/Device';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditDeviceComponent } from '../modals/edit-device/edit-device.component';
import { NotificationService } from '../services/notification/notification.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { DeviceStatus } from '../classes/DeviceStatus';

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { HistoryData } from '../classes/HistoryData';
import { TimeFormatPipe } from '../time-format.pipe';

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
    FormsModule,
    TimeFormatPipe,
  ],
  animations: [
    trigger('fadeInOutAnimation', [
      transition(':enter', [
        style({ opacity: 0, height: '0px' }),
        animate('300ms ease-out', style({ opacity: 1, height: '*' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, height: '0px' })),
      ]),
    ]),
  ],
})
export class SettingsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  NEEDCONFIRMATION = DeviceStatus.NEEDCONFIRMATION;
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns: string[] = ['id', 'date', 'deviceId', 'queue', 'values'];
  config = {
    information: 36000,
    seuil: 10,
    status: 50000,
    alert: 50,
    track: 10,
    confirmation: 10,
  };
  dataSource: MatTableDataSource<any>;
  private socketChanges$: Subject<void> = new Subject<void>();
  private onDestroy$: Subject<void> = new Subject<void>();
  oldPassword: string = '';
  newPassword: string = '';
  showPasswordForm: boolean = false;
  confirmPassword: string = '';
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
    this.getConfig();
    this.getListLog();
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

  resetPassword() {
    this.notificationService
      .confirm('Etes vous sur de vouloir réinitialiser le mot de passe')
      .then((response) => {
        if (response.isConfirmed) {
          this.service.resetPassword('Manorintsoa').subscribe((res) => {
            this.notificationService.info('Mot de passe réinitialisé');
          });
        }
      });
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
  }
  changePassword() {
    this.notificationService
      .confirm('Etes vous sur de vouloir changer le mot de passe')
      .then((response) => {
        if (response.isConfirmed) {
          this.service
            .changePassword(
              'antsomanoirina90@gmail.com',
              this.oldPassword,
              this.newPassword
            )
            .subscribe((res) => {
              if (res) {
                this.notificationService.success('Mot de passe changé');
                this.showPasswordForm = false;
                this.oldPassword = '';
                this.newPassword = '';
              } else {
                this.notificationService.error('Mot de passe incorrect');
                this.oldPassword = '';
                this.newPassword = '';
              }
            });
        }
      });
  }

  getPicker(typeData: string, data: number) {
    this.notificationService.getDelai(data).then((response) => {
      if (response <= 0) return null;
      this.notificationService
        .confirm('Etes vous sur de vouloir modifier')
        .then((next) => {
          if (next.isConfirmed) {
            this.service.setConfig(typeData, response).subscribe((res) => {
              this.notificationService.success('Modifié');
              this.getConfig();
            });
          }
        });
    });
  }

  getConfig() {
    this.service.getConfig().subscribe((res) => {
      if (res) {
        this.config = res.config;
      }
    });
  }

  getListLog() {
    this.service.getListLog().subscribe((res) => {
      console.log(res);
      this.dataSource = new MatTableDataSource(res.result);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
}
