import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ICitaBarbero {
  id_reserva: number;
  id_cliente: number;
  id_barbero: number;
  fecha: string;
  hora: string;
  estado: string;
  nombre_cliente: string;
  nombre_servicio: string;
  duracion_total: number;
  precio_total: number;
}

@Injectable({ providedIn: 'root' })
export class BarberoAgendaService {

  private url = `${environment.apiUrl}/reservas`;

  constructor(private http: HttpClient) { }

  getCitasHoy(): Observable<{ ok: boolean; data: ICitaBarbero[] }> {
    return this.http.get<{ ok: boolean; data: ICitaBarbero[] }>(`${this.url}/barbero/hoy`);
  }

  getProximas(): Observable<{ ok: boolean; data: ICitaBarbero[] }> {
    return this.http.get<{ ok: boolean; data: ICitaBarbero[] }>(`${this.url}/barbero/proximas`);
  }

  cambiarEstado(id: number, estado: string): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.url}/${id}`, { estado });
  }
  registrarPresencial(data: {
    nombre: string;
    apellido: string;
    id_servicio: number;
    fecha: string;
    hora: string;
  }): Observable<{ ok: boolean; mensaje: string }> {
    return this.http.post<{ ok: boolean; mensaje: string }>(
      `${this.url}/barbero/registrar-presencial`, data
    );
  }
}