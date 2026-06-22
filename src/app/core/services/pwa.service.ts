import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, filter } from 'rxjs';
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

  private installAvailableSubject = new BehaviorSubject(false);
  installAvailable$ = this.installAvailableSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone,
    private swUpdate: SwUpdate,
    private toast: ToastService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  init(): void {
    if (!this.isBrowser) return;

    this.listenInstallPrompt();
    this.listenForUpdates();
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
}
