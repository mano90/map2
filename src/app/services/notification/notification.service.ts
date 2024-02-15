import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  success(text: string) {
    return Swal.fire({
      title: 'Success',
      text,
      icon: 'success',
    });
  }

  info(text: string) {
    return Swal.fire({
      title: 'Success',
      text,
      icon: 'info',
    });
  }

  error(text: string) {
    return Swal.fire({
      title: 'Erreur',
      text,
      icon: 'error',
    });
  }

  confirm(title: string) {
    return Swal.fire({
      title: title,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Annuler',
    });
  }
  autoClose(icon: SweetAlertIcon, title: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
    return Toast.fire({
      icon,
      title,
    });
  }
}
