import { Component, OnDestroy, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { NotificationService } from './services/notification/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    private socket: Socket,
    private notificationService: NotificationService
  ) {}
  // private socketChanges$: Subject<void> = new Subject<void>();
  private onDestroy$: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    this.socket.on('error-sms-device', () => {
      console.log('errors');
      this.notificationService.error('Problem with connection with the SMS');
    });
  }
  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
