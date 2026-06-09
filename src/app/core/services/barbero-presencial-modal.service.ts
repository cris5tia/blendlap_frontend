import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BarberoPresencialModalService {
  private abiertoSubject = new BehaviorSubject<boolean>(false);
  private reservaCreadaSubject = new Subject<void>();

  abierto$ = this.abiertoSubject.asObservable();
  reservaCreada$ = this.reservaCreadaSubject.asObservable();

  abrir(): void {
    this.abiertoSubject.next(true);
    document.body.style.overflow = 'hidden';
  }

  cerrar(): void {
    this.abiertoSubject.next(false);
    document.body.style.overflow = '';
  }

  notificarReservaCreada(): void {
    this.reservaCreadaSubject.next();
  }
}
