import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { LayoutComponent } from './layout/layout.component';
import { DeviceSettingsComponent } from './device-settings/device-settings.component';
import { DeviceHistoryComponent } from './device-history/device-history.component';
import { AccueilComponent } from './accueil/accueil.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
  { path: '', component: LayoutComponent, canActivate: [authGuard] },

  {
    path: 'parametres',
    component: SettingsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'materiel',
    component: GeneralSettingsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'device-history/:id/:filter',
    component: DeviceHistoryComponent,
    canActivate: [authGuard],
  },
  {
    path: 'device',
    component: DeviceSettingsComponent,
    canActivate: [authGuard],
  },
  { path: 'accueil', component: AccueilComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
