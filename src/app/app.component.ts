import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { PwaService } from './core/services/pwa.service';
import { WakeUpService } from './core/services/wake-up.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  installAvailable$ = this.pwaService.installAvailable$;
  notificationPermission$ = this.pwaService.notificationPermission$;

  constructor(
    public authService: AuthService,
    private pwaService: PwaService,
    wakeUpService: WakeUpService
  ) {
    void wakeUpService.wake();
  }

  ngOnInit(): void {
    this.pwaService.init();
  }

  installApp(): void {
    void this.pwaService.install();
  }

  enableNotifications(): void {
    void this.pwaService.enableNotifications();
  }
}
