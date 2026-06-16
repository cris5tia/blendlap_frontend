import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { PwaService } from './core/services/pwa.service';
import { WakeUpService } from './core/services/wake-up.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  title = 'frontend';
  showInstallPrompt = false;
  showNotificationPrompt = false;
  private installPromptTimer: any;
  private notificationPromptTimer: any;

  constructor(
    public authService: AuthService,
    private pwaService: PwaService,
    wakeUpService: WakeUpService
  ) {
    void wakeUpService.wake();
  }

  ngOnInit(): void {
    this.pwaService.init();
    this.pwaService.installAvailable$.subscribe(available => {
      if (available) {
        this.showInstallPrompt = true;
        this.clearInstallPromptTimer();
        this.installPromptTimer = setTimeout(() => this.hideInstallPrompt(), 8000);
      }
    });
    this.pwaService.notificationPermission$.subscribe(permission => {
      if (permission === 'default' && this.authService.getUsuario()) {
        this.showNotificationPrompt = true;
        this.clearNotificationPromptTimer();
        this.notificationPromptTimer = setTimeout(() => this.hideNotificationPrompt(), 8000);
      }
    });
  }

  installApp(): void {
    void this.pwaService.install();
  }

  hideInstallPrompt(): void {
    this.showInstallPrompt = false;
    this.clearInstallPromptTimer();
  }

  enableNotifications(): void {
    void this.pwaService.enableNotifications();
    this.hideNotificationPrompt();
  }

  hideNotificationPrompt(): void {
    this.showNotificationPrompt = false;
    this.clearNotificationPromptTimer();
  }

  private clearInstallPromptTimer(): void {
    if (this.installPromptTimer) clearTimeout(this.installPromptTimer);
  }

  private clearNotificationPromptTimer(): void {
    if (this.notificationPromptTimer) clearTimeout(this.notificationPromptTimer);
  }
}
