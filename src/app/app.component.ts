import { Component } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { WakeUpService } from './core/services/wake-up.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend';

  constructor(public authService: AuthService, wakeUpService: WakeUpService) {
    void wakeUpService.wake();
  }
}
