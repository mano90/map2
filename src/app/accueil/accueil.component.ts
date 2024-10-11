import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnexionService } from './services/connexion.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';

interface Accueil {
  Id: number;
  Poste: string;
  currentDate: Date;
  currentTime: Date | string;
  currentTimer: Date | string;
  currentMulti: number | string;
}

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

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss'],
  providers: [DatePipe],
})
export class AccueilComponent implements OnInit, OnDestroy {
  //Timer
  // currentPoste: string = 'Poste 01';
  timeOuts: any[] = [];
  currentDate: string = '';
  currentTime: string[] = [];
  currentMulti: string[] = [];
  currentTimer: string[] = [];
  multiplicite: number = 0;

  showDate: boolean = false;

  interval: any[] = [];
  seconds: number[] = [];
  minutes: number[] = [];
  hours: number[] = [];
  isRunning: boolean = false;
  playButtonClicked: boolean[] = [];

  //List
  ConnexionsList: any = [];
  PosteList: any = [];

  searchText = '';
  ConnexionsForm!: FormGroup;
  PosteForm!: FormGroup;

  updtadeAbonnesForm!: FormGroup;
  formModal: any;

  constructor(
    private datePipe: DatePipe,
    public ConnexionsService: ConnexionService,
    private route: Router,
    public fb: FormBuilder
  ) {
    this.ConnexionsForm = this.fb.group({
      Id: [''],
      Poste: [''],
      Date: [''],
      Heure_Debut: [''],
      Duree: [''],
      Multi: [''],
      Montant: [''],

      IdTarif: [''],
      Prix: [''],
    });

    this.PosteForm = this.fb.group({
      Id_Poste: new FormControl('', [Validators.required]),
      Poste: new FormControl('', [Validators.required]),
    });
  }

  GetPoste() {
    const data = [
      {
        Id: 1,
        Poste: 'Poste 01',
      },
      {
        Id: 11,
        Poste: 'Poste 02',
      },
      {
        Id: 12,
        Poste: 'Poste 03',
      },
      {
        Id: 13,
        Poste: 'Poste 04',
      },
      {
        Id: 14,
        Poste: 'Poste 05',
      },
    ];
    this.PosteList = data;
    this.timeOuts = [];
    for (let i = 0; i < data.length; i++) {
      this.interval.push(null);
      this.minutes.push(0);
      this.hours.push(0);
      this.seconds.push(0);
    }
  }

  GetTarif() {
    const data = [
      {
        Id: 1,
        Prix: 20,
      },
    ];
    const premierTarif = data[0];
    this.ConnexionsForm.controls['IdTarif'].setValue(premierTarif.Id),
      this.ConnexionsForm.controls['Prix'].setValue(premierTarif.Prix);
  }

  ngOnInit() {
    this.GetTarif();
    this.GetPoste();
  }

  ngOnDestroy() {
    this.interval.forEach((inter) => {
      clearInterval(inter);
    });
  }

  startTimer(index: number) {
    // if (!this.isRunning) {
    this.interval[index] = setInterval(() => {
      this.seconds[index]++;
      if (this.seconds[index] === 60) {
        this.seconds[index] = 0;
        this.minutes[index]++;
        this.multiplicite++;
        if (this.minutes[index] === 60) {
          this.minutes[index] = 0;
          this.hours[index]++;
          if (this.hours[index] === 24) {
            this.hours[index] = 0;
          }
        }
      }
      this.currentTimer[index] = `${this.pad(this.hours[index])}:${this.pad(
        this.minutes[index]
      )}:${this.pad(this.seconds[index])}`;

      this.currentMulti[index] = this.multiplicite.toString();
    }, 1000);
    this.isRunning = true;
    // }
  }

  play(index: number) {
    const now = new Date();

    const formattedDate = this.datePipe.transform(now, 'dd-MM-yyyy');
    const formattedTime = this.datePipe.transform(now, 'HH:mm:ss');

    this.currentDate = formattedDate || '';
    this.currentTime[index] = formattedTime || '';
    this.currentMulti[index] = '0';

    this.showDate = true;

    this.playButtonClicked[index] = true;

    this.startTimer(index);
  }

  pauseTimer(index: number) {
    clearInterval(this.interval[index]);
    this.isRunning = false;
  }

  stopTimer(index: number) {
    clearInterval(this.interval[index]);
    this.isRunning = false;
    this.playButtonClicked[index] = false;

    for (const poste of this.PosteList) {
      this.ConnexionsForm.controls['Poste'].setValue(poste.Poste);
      this.ConnexionsForm.controls['Date'].setValue(this.currentDate);
      this.ConnexionsForm.controls['Heure_Debut'].setValue(this.currentTime);
      this.ConnexionsForm.controls['Duree'].setValue(this.currentTimer);
      this.ConnexionsForm.controls['Multi'].setValue(this.currentMulti);

      // const tarif = this.ConnexionsForm.get("Tarif")?.value;
      // console.log(tarif);
      // this.ConnexionsForm.controls['Montant'].setValue(this.currentMulti);
    }

    //Arreter la minuterie
    this.currentTimer[index] = '';
    this.currentDate = '';
    this.currentTime[index] = '';
    this.currentMulti[index] = '';

    // this.seconds = 0;
    // this.minutes = 0;jh
    // this.hours = 0;
    this.multiplicite = 0;
  }

  pad(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
  // updateTime(minuteur: Accueil) {
  //   this.seconds++;
  //   if (this.seconds === 60) {
  //     this.seconds = 0;
  //     this.minutes++;
  //     this.multiplicite++;
  //     if (this.minutes === 60) {
  //       this.minutes = 0;
  //       this.hours++;
  //       if (this.hours === 24) {
  //         this.hours = 0;
  //       }
  //     }
  //   }
  //   minuteur.currentTimer = `${this.pad(this.hours)}:${this.pad(this.minutes)}:${this.pad(this.seconds)}`;

  //   // Incrémenter currentMulti à chaque mise à jour du timer
  //   minuteur.currentMulti = this.multiplicite.toString();
  // }
}
