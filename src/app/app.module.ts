import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule, DecimalPipe } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { MapComponent } from './components/map/map.component';
import { ScalelineComponent } from './components/scaleline/scaleline.component';
import { MousePositionComponent } from './components/mouse-position/mouse-position.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutComponent } from './layout/layout.component';
import { DeviceSettingsComponent } from './device-settings/device-settings.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TopChangeDirective } from './top-change.directive';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';
import {
  MatSlideToggleModule,
  _MatSlideToggleRequiredValidatorModule,
} from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import { MY_FORMATS } from './general-settings/general-settings.component';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { DeviceHistoryComponent } from './device-history/device-history.component';
import { FormatCoordinatesPipe } from './format-coordinates.pipe';
import { ErrorInterceptorService } from './interceptors/error-interceptor.service';
import { AlertHistoryComponent } from './alert-history/alert-history.component';
const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ScalelineComponent,
    MousePositionComponent,
    LayoutComponent,
    DeviceSettingsComponent,
    TopChangeDirective,
    SidebarComponent,
    DeviceHistoryComponent,
    FormatCoordinatesPipe,
    AlertHistoryComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    NgxSpinnerModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatIconModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CommonModule,
    MatSlideToggleModule,
    _MatSlideToggleRequiredValidatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    RouterModule,
    MatCardModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    SocketIoModule.forRoot(config),
  ],
  providers: [
    DecimalPipe,
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptorService,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
