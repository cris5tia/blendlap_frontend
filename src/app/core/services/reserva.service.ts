import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface IBarbero {
  id_usuario: number;
  nombre: string;
  apellido: string;
  foto?: string;
  titulo?: string;
  especialidades?: string;
  descripcion?: string;
  experiencia?: number;
  total_agendamientos?: number;
  promedio_estrellas?: number;
  total_resenas?: number;
}

export interface ISlot {
  hora: string;
  disponible: boolean;
}

export interface IDisponibilidad {
  id_barbero: number;
  fecha: string;
  disponible: boolean;
  slots: ISlot[];
}

export interface ICrearReserva {
  id_cliente: number;
  id_barbero: number;
  fecha: string;
  hora: string;
  servicios: number[];
}

export interface IReserva {
  id_reserva: number;
  id_cliente: number;
  id_barbero: number;
  fecha: string;
  hora: string;
  estado: string;
  nombre_cliente: string;
  nombre_barbero: string;
  nombre_servicio?: string;
  precio?: number;
  precio_total?: number;
  tiene_resena?: boolean;
  duracion_total?: number;
  servicios?: number[];
}

@Injectable({ providedIn: 'root' })
export class ReservaService {

  private url = `${environment.apiUrl}/reservas`;
  private urlUsuarios = `${environment.apiUrl}/usuarios`;
  private urlHorarios = `${environment.apiUrl}/horarios`;

  constructor(private http: HttpClient) { }

  getBarberos(): Observable<{ ok: boolean; data: IBarbero[] }> {
    return this.http.get<{ ok: boolean; data: IBarbero[] }>(`${this.urlUsuarios}/barberos`);
  }

  getDisponibilidad(id_barbero: number, fecha: string, duracion_total: number): Observable<{ ok: boolean; data: IDisponibilidad }> {
    return this.http.get<{ ok: boolean; data: IDisponibilidad }>(
      `${this.url}/disponibilidad?id_barbero=${id_barbero}&fecha=${fecha}&duracion_total=${duracion_total}`
    );
  }

  crear(data: ICrearReserva): Observable<{ ok: boolean; data: any }> {
    return this.http.post<{ ok: boolean; data: any }>(this.url, data);
  }

  getHorarioBarberia(): Observable<{ ok: boolean; data: any[] }> {
    return this.http.get<{ ok: boolean; data: any[] }>(this.urlHorarios)
      .pipe(timeout(8000));
  }

  getAllAdmin(filtros?: { fecha?: string; id_barbero?: string; estado?: string }): Observable<{ ok: boolean; data: IReserva[] }> {
    let params: any = {};
    if (filtros?.fecha) params.fecha = filtros.fecha;
    if (filtros?.id_barbero) params.id_barbero = filtros.id_barbero;
    if (filtros?.estado) params.estado = filtros.estado;
    return this.http.get<{ ok: boolean; data: IReserva[] }>(this.url, { params });
  }

  cambiarEstado(id: number, estado: string): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.url}/${id}`, { estado });
  }

  cancelar(id: number): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.url}/${id}`, { estado: 'cancelada' });
  }
  getMisReservas(): Observable<{ ok: boolean; data: IReserva[] }> {
    return this.http.get<{ ok: boolean; data: IReserva[] }>(`${this.url}/mis-reservas`);
  }
  actualizar(id: number, data: { fecha: string; hora: string }): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.url}/${id}`, data);
  }
  getServicios(): Observable<{ ok: boolean; data: any[] }> {
    return this.http.get<{ ok: boolean; data: any[] }>(`${environment.apiUrl}/servicios`)
      .pipe(timeout(8000));
  }
}