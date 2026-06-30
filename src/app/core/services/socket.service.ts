import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {

  private socket: Socket | null = null;

  private reservaNueva$       = new Subject<any>();
  private reservaActualizada$ = new Subject<any>();
  private reservaEliminada$   = new Subject<any>();
  private ventaNueva$         = new Subject<any>();
  private gastoEvento$        = new Subject<any>();
  private creditoEvento$      = new Subject<any>();
  private turnoEvento$        = new Subject<any>();

  connect(): void {
    if (this.socket?.connected) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
    });

    this.socket.on('reserva:nueva',       (d) => this.reservaNueva$.next(d));
    this.socket.on('reserva:actualizada', (d) => this.reservaActualizada$.next(d));
    this.socket.on('reserva:eliminada',   (d) => this.reservaEliminada$.next(d));
    this.socket.on('venta:nueva',         (d) => this.ventaNueva$.next(d));
    this.socket.on('gasto:nuevo',         (d) => this.gastoEvento$.next(d));
    this.socket.on('gasto:actualizado',   (d) => this.gastoEvento$.next(d));
    this.socket.on('gasto:eliminado',     (d) => this.gastoEvento$.next(d));
    this.socket.on('credito:actualizado', (d) => this.creditoEvento$.next(d));
    this.socket.on('turno:nuevo',         (d) => this.turnoEvento$.next(d));
    this.socket.on('turno:actualizado',   (d) => this.turnoEvento$.next(d));
    this.socket.on('turno:eliminado',     (d) => this.turnoEvento$.next(d));

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Error de conexión:', err.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  onReservaNueva():       Observable<any> { return this.reservaNueva$.asObservable(); }
  onReservaActualizada(): Observable<any> { return this.reservaActualizada$.asObservable(); }
  onReservaEliminada():   Observable<any> { return this.reservaEliminada$.asObservable(); }
  onVentaNueva():         Observable<any> { return this.ventaNueva$.asObservable(); }
  onGastoEvento():        Observable<any> { return this.gastoEvento$.asObservable(); }
  onCreditoEvento():      Observable<any> { return this.creditoEvento$.asObservable(); }
  onTurnoEvento():        Observable<any> { return this.turnoEvento$.asObservable(); }

  ngOnDestroy(): void { this.disconnect(); }
}
