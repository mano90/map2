import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class ErrorInterceptorService implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 500) {
          console.log(error.error);
          // Show SweetAlert error message for 500 Internal Server Error
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text:
              error.error.message ||
              'Something went wrong! Internal Server Error.',
            confirmButtonText: 'Ok',
          });
        } else {
          console.log('ato');
        }
        return throwError(error); // Rethrow the error to allow further handling
      })
    );
  }
}
