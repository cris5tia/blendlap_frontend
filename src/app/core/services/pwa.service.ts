import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { SwPush, SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, filter, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly isBrowser: boolean;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private apiUrl = `${environment.apiUrl}/notificaciones`;

  private installAvailableSubject = new BehaviorSubject(false);
  installAvailable$ = this.installAvailableSubject.asObservable();

  private notificationPermissionSubject = new BehaviorSubject<NotificationPermission>('default');
  notificationPermission$ = this.notificationPermissionSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    @Inject(DOCUMENT) private document: Document,
    private http: HttpClient,
    private ngZone: NgZone,
    private swPush: SwPush,
    private swUpdate: SwUpdate,
    private toast: ToastService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  init(): void {
    if (!this.isBrowser) return;

    this.syncNotificationPermission();
    this.listenInstallPrompt();
    this.listenForUpdates();
    this.listenPushMessages();
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) return;

    await this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.installAvailableSubject.next(false);

    if (choice.outcome === 'accepted') {
      this.toast.success('Blendlap instalado', 'Ya puedes abrirlo como app.');
    }
  }

  async enableNotifications(): Promise<void> {
    if (!this.isBrowser || !this.swPush.isEnabled || !('Notification' in window)) {
      this.toast.warning('No disponible', 'Este navegador no permite notificaciones web.');
      return;
    }

    const serverPublicKey = await this.getVapidPublicKey();

    if (!serverPublicKey) {
      this.toast.warning('Falta configuración', 'Agrega la clave pública VAPID para activar Web Push.');
      return;
    }

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey
      });

      await firstValueFrom(this.http.post(`${this.apiUrl}/suscripciones`, subscription));
      this.syncNotificationPermission();
      this.toast.success('Notificaciones activas', 'Te avisaremos sobre tus citas y novedades.');
    } catch (_error) {
      this.syncNotificationPermission();
      this.toast.error('No se activaron', 'Revisa el permiso del navegador e inténtalo de nuevo.');
    }
  }

  private async getVapidPublicKey(): Promise<string> {
    if (environment.vapidPublicKey) return environment.vapidPublicKey;

    try {
      const response = await firstValueFrom(
        this.http.get<{ ok: boolean; publicKey: string }>(`${this.apiUrl}/vapid-public-key`)
      );
      return response.publicKey || '';
    } catch (_error) {
      return '';
    }
  }

  private listenInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.ngZone.run(() => {
        this.deferredPrompt = event as BeforeInstallPromptEvent;
        this.installAvailableSubject.next(true);
      });
    });

    window.addEventListener('appinstalled', () => {
      this.ngZone.run(() => {
        this.deferredPrompt = null;
        this.installAvailableSubject.next(false);
      });
    });
  }

  private listenForUpdates(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.toast.info('Actualización disponible', 'Reabre la app para usar la nueva versión.');
      });
  }

  private listenPushMessages(): void {
    if (!this.swPush.isEnabled) return;

    this.swPush.messages.subscribe((message: any) => {
      const title = message?.notification?.title || message?.title || 'Blendlap';
      const body = message?.notification?.body || message?.body;
      this.toast.info(title, body);
    });

    this.swPush.notificationClicks.subscribe(({ action, notification }) => {
      const target = action || notification?.data?.url || '/';
      this.document.defaultView?.location.assign(target);
    });
  }

  private syncNotificationPermission(): void {
    if (!this.isBrowser || !('Notification' in window)) return;
    this.notificationPermissionSubject.next(Notification.permission);
  }
}
