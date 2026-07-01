import { Component, OnInit } from '@angular/core';
import { PushService } from '../../core/services/push.service';

@Component({
  selector: 'app-cliente-layout',
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-chat-widget></app-chat-widget>

    <!-- Banner recordatorios push — solo aparece en PWA, una vez -->
    <div class="push-banner" *ngIf="mostrarBanner">
      <div class="push-banner__icon">🔔</div>
      <div class="push-banner__texto">
        <strong>Recordatorios de cita</strong>
        <span>Activa las notificaciones y te avisamos antes de tu cita.</span>
      </div>
      <div class="push-banner__acciones">
        <button class="push-banner__btn push-banner__btn--activar" (click)="activarPush()">
          Activar
        </button>
        <button class="push-banner__btn push-banner__btn--no" (click)="rechazarPush()">
          Ahora no
        </button>
      </div>
    </div>
  `,
  styles: [`
    .push-banner {
      position: fixed;
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      background: #1a1a1a;
      color: #fff;
      border-radius: 16px;
      padding: 1rem 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      z-index: 1000;
      animation: slideUpBanner 0.35s ease;
    }
    @keyframes slideUpBanner {
      from { transform: translateY(80px); opacity: 0; }
      to   { transform: translateY(0);   opacity: 1; }
    }
    .push-banner__icon { font-size: 1.5rem; flex-shrink: 0; }
    .push-banner__texto {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .push-banner__texto strong { font-size: 0.88rem; }
    .push-banner__texto span   { font-size: 0.78rem; color: #ccc; }
    .push-banner__acciones {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }
    .push-banner__btn {
      border: none;
      border-radius: 30px;
      padding: 0.45rem 0.9rem;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .push-banner__btn:hover { opacity: 0.85; }
    .push-banner__btn--activar { background: #FBC447; color: #1a1a1a; }
    .push-banner__btn--no      { background: rgba(255,255,255,0.12); color: #fff; }
  `]
})
export class ClienteLayoutComponent implements OnInit {
  mostrarBanner = false;

  constructor(private pushService: PushService) {}

  ngOnInit(): void {
    this.mostrarBanner = this.pushService.debeMostrarBanner();
  }

  async activarPush(): Promise<void> {
    this.mostrarBanner = false;
    await this.pushService.suscribir();
  }

  rechazarPush(): void {
    this.mostrarBanner = false;
    this.pushService.rechazarBanner();
  }
}
