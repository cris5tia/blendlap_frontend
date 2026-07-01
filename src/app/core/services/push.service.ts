import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const FLAG_SOLICITADO = 'push_solicitado';

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly api = `${environment.apiUrl}/notificaciones`;

  constructor(private swPush: SwPush, private http: HttpClient) {}

  /** True cuando la app está instalada y abierta como PWA (no en pestaña del navegador) */
  esPWA(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  /** True si hay que mostrar el banner (PWA + sin permiso + sin respuesta previa) */
  debeMostrarBanner(): boolean {
    if (!this.esPWA()) return false;
    if (!this.swPush.isEnabled) return false;
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return false;
    if (Notification.permission === 'denied') return false;
    if (localStorage.getItem(FLAG_SOLICITADO) === '1') return false;
    return true;
  }

  /** El usuario rechazó el banner — no volver a mostrarlo */
  rechazarBanner(): void {
    localStorage.setItem(FLAG_SOLICITADO, '1');
  }

  /** Suscribir al usuario a push notifications */
  async suscribir(): Promise<boolean> {
    if (!this.swPush.isEnabled) return false;
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'denied') return false;

    try {
      const res = await firstValueFrom(
        this.http.get<{ ok: boolean; data: { publicKey: string } }>(`${this.api}/vapid-key`)
      );
      const serverPublicKey = res?.data?.publicKey;
      if (!serverPublicKey) return false;

      const subscription = await this.swPush.requestSubscription({ serverPublicKey });

      await firstValueFrom(
        this.http.post(`${this.api}/suscribir`, subscription)
      );

      localStorage.setItem(FLAG_SOLICITADO, '1');
      return true;
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') {
        console.warn('[Push] Error al suscribir:', err);
      }
      localStorage.setItem(FLAG_SOLICITADO, '1');
      return false;
    }
  }
}
