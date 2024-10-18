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

  input() {
    return Swal.fire({
      title: 'Entrez le seuil ',
      input: 'number',
      inputAttributes: {
        min: '1900',
        max: '2099',
        step: '1',
      },
      showCancelButton: true,
      confirmButtonText: 'Ok',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || +value <= 0) {
          return 'Valeur invalide';
        }
        return null;
      },
    });
  }

  async customInput(): Promise<
    | {
        duration: number;
        frequency: number;
      }
    | 0
  > {
    let totalSeconds = 0;
    return Swal.fire({
      title: 'Entrez le délai de track',
      html: `
      <div>
        <label for="hours">Heures:</label>
        <input type="number" id="hours" class="swal2-input" min="0" max="23" value="0">
      </div>
      <div>
        <label for="minutes">Minutes:</label>
        <input type="number" id="minutes" class="swal2-input" min="0" max="59" value="0">
      </div>
      <div>
        <label for="seconds">Secondes:</label>
        <input type="number" id="seconds" class="swal2-input" min="0" max="59" value="0">
      </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Ok',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        // Cast elements to HTMLInputElement
        const hours = (document.getElementById('hours') as HTMLInputElement)
          .value;
        const minutes = (document.getElementById('minutes') as HTMLInputElement)
          .value;
        const seconds = (document.getElementById('seconds') as HTMLInputElement)
          .value;

        // Validation: Check if any of the values are invalid
        if (
          +hours < 0 ||
          +hours > 23 ||
          +minutes < 0 ||
          +minutes > 59 ||
          +seconds < 0 ||
          +seconds > 59
        ) {
          Swal.showValidationMessage('Veuillez entrer des valeurs valides');
        }

        // Convert hours, minutes, and seconds to total seconds
        totalSeconds = +hours * 3600 + +minutes * 60 + +seconds;

        if (totalSeconds <= 0) {
          Swal.showValidationMessage(
            'Le délai doit être supérieur à 0 secondes'
          );
        }

        return totalSeconds; // Return the total seconds
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        return Swal.fire({
          title: 'Entrez la fréquence de track',
          html: `
          <div>
            <label for="hours">Heures:</label>
            <input type="number" id="hoursTrack" class="swal2-input" min="0" max="23" value="0">
          </div>
          <div>
            <label for="minutes">Minutes:</label>
            <input type="number" id="minutesTrack" class="swal2-input" min="0" max="59" value="0">
          </div>
          <div>
            <label for="seconds">Secondes:</label>
            <input type="number" id="secondsTrack" class="swal2-input" min="0" max="59" value="0">
          </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Ok',
          cancelButtonText: 'Annuler',
          preConfirm: () => {
            const hoursTrack = (
              document.getElementById('hoursTrack') as HTMLInputElement
            ).value;
            const minutesTrack = (
              document.getElementById('minutesTrack') as HTMLInputElement
            ).value;
            const secondsTrack = (
              document.getElementById('secondsTrack') as HTMLInputElement
            ).value;

            // Validation: Check if any of the values are invalid
            if (
              +hoursTrack < 0 ||
              +hoursTrack > 23 ||
              +minutesTrack < 0 ||
              +minutesTrack > 59 ||
              +secondsTrack < 0 ||
              +secondsTrack > 59
            ) {
              Swal.showValidationMessage('Veuillez entrer des valeurs valides');
            }

            // Convert hours, minutes, and seconds to total seconds
            const totalSecondsTrack =
              +hoursTrack * 3600 + +minutesTrack * 60 + +secondsTrack;

            if (totalSecondsTrack <= 0) {
              Swal.showValidationMessage(
                'Le délai doit être supérieur à 0 secondes'
              );
            }

            if (totalSecondsTrack >= totalSeconds)
              Swal.showValidationMessage(
                'La fréquence de track doit être inférieur à la durée du track'
              );
            return totalSecondsTrack;
          },
        }).then(async (resultTrack) => {
          if (resultTrack.isConfirmed) {
            return {
              duration: Number(result.value),
              frequency: Number(resultTrack.value),
            };
          }
          return 0;
        });
      }
      return 0;
    });
  }
}
