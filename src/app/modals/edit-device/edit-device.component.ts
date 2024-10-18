import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Device } from 'src/app/classes/Device';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApicallService } from 'src/app/services/requests/apicall.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { DeviceStatus } from 'src/app/classes/DeviceStatus';

@Component({
  selector: 'app-edit-device',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './edit-device.component.html',
  styleUrls: ['./edit-device.component.scss'],
})
export class EditDeviceComponent implements OnInit {
  id: number = null;
  protected title = 'Ajouter';
  deviceForm: FormGroup;
  constructor(
    private service: ApicallService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<EditDeviceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { device: Device; edit?: boolean }
  ) {}

  ngOnInit(): void {
    let data: Device = {
      name: null,
      deviceNumber: null,
      seuil: null,
      // icon: null,
    };

    if (this.data.edit === true) {
      this.title = 'Modifier';
      this.id = this.data.device.id;
      data = this.data.device as Device;
    }

    this.deviceForm = this.formBuilder.group({
      name: [data.name, Validators.required],
      deviceNumber: [data.deviceNumber, Validators.required],
      seuil: [data.seuil, Validators.required],
    });
  }
  onSubmit() {
    if (this.deviceForm.valid) {
      const data: Device = this.deviceForm.value;
      if (this.data.edit == false) {
        data.icon = '202402131343307751.png';
        data.status = DeviceStatus.NEEDCONFIRMATION;
      }
      if (this.id) data.id = this.id;
      this.service.saveDevice(data).subscribe({
        next: () => {
          this.notificationService.autoClose('success', 'Infos ajoutés');
          this.dialogRef.close('success');
        },
        error: () => {
          this.notificationService.error(
            "Vérifiez que le numéro téléphone n'est pas utilisé ailleurs"
          );
          this.dialogRef.close('success');
        },
      });
    }
  }
}
