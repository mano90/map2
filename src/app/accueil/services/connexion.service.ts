import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  provideHttpClient,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs';
interface Connexion {
  Id: number;
  Poste: string;
  Date: Date;
  Heure_Debut: Date;
  Duree: Date;
  Montant: number;

  // Id_Poste:number,

  IdTarif: number;
  Prix: number;
}
@Injectable({
  providedIn: 'root',
})
export class ConnexionService {
  constructor(private httpClient: HttpClient) {}

  // Http Headers
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  // GET Connexion
  getConnexions(): Observable<Connexion[]> {
    return this.httpClient
      .get<Connexion[]>('http://127.0.0.1:8000/api/connexions')
      .pipe(retry(1), catchError(this.errorHandl));
  }

  // GET Tarif
  getTarif(): Observable<Connexion[]> {
    return this.httpClient
      .get<Connexion[]>('http://127.0.0.1:8000/api/tarif')
      .pipe(retry(1), catchError(this.errorHandl));
  }

  // GET Poste
  getPostes(): Observable<Connexion[]> {
    return this.httpClient
      .get<Connexion[]>('http://127.0.0.1:8000/api/postes')
      .pipe(retry(1), catchError(this.errorHandl));
  }
  // ADD Connexion
  addConnexions(data: Connexion): Observable<Connexion> {
    return this.httpClient
      .post<Connexion>(
        'http://127.0.0.1:8000/api/connexion',
        data,
        this.httpOptions
      )
      .pipe(
        retry(1), // Tentative de réessayer une fois en cas d'échec
        catchError(this.errorHandl) // Gestion des erreurs
      );
  }

  // UPDATE Tarif
  updateTarif(id: number, data: any): Observable<Connexion> {
    return this.httpClient
      .put<Connexion>(
        `http://127.0.0.1:8000/api/tarif/${id}`, // Ajoutez un slash et utilisez ${id} pour l'ID
        data,
        this.httpOptions
      )
      .pipe(catchError(this.errorHandl));
  }

  // Gestion des erreurs
  errorHandl(error: any) {
    let errorMessage = '';
    if (error.error instanceof Error) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      errorMessage = `Code d'erreur : ${error.status}\nMessage : ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
