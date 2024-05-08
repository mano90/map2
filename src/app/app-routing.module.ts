import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { LayoutComponent } from './layout/layout.component';
import { DeviceSettingsComponent } from './device-settings/device-settings.component';
import { DeviceHistoryComponent } from './device-history/device-history.component';

const routes: Routes = [
  { path: '', component: LayoutComponent },

  {
    path: 'parametres',
    component: GeneralSettingsComponent,
  },
  { path: 'device-history/:id', component: DeviceHistoryComponent },
  { path: 'device', component: DeviceSettingsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
