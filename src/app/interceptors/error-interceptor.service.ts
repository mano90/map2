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
        console.log(error);
        if (error.status === 500) {
          // Show SweetAlert error message for 500 Internal Server Error
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong! Internal Server Error.',
            confirmButtonText: 'Ok',
          });
        }
        return throwError(error); // Rethrow the error to allow further handling
      })
    );
  }
}
