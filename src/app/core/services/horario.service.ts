import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IHorarioDia {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: number;
  excepciones?: IExcepcion[];
}

export interface IExcepcion {
  id_excepcion?: number;
  id_usuario?: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  motivo: string;
}

@Injectable({ providedIn: 'root' })
export class HorarioService {

  private url = `${environment.apiUrl}/horarios`;

  constructor(private http: HttpClient) {}

  getHorarioBarberia(): Observable<{ ok: boolean; data: IHorarioDia[] }> {
    return this.http.get<{ ok: boolean; data: IHorarioDia[] }>(this.url);
  }

  getHorarioCompleto(id_barbero: number): Observable<{ ok: boolean; data: IHorarioDia[] }> {
    return this.http.get<{ ok: boolean; data: IHorarioDia[] }>(`${this.url}/barbero/${id_barbero}`);
  }

  updateDia(dia: number, data: Partial<IHorarioDia>): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.url}/dia/${dia}`, data);
  }

  crearExcepcion(data: IExcepcion): Observable<{ ok: boolean; id_excepcion: number }> {
    return this.http.post<{ ok: boolean; id_excepcion: number }>(`${this.url}/excepciones`, data);
  }

  eliminarExcepcion(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.url}/excepciones/${id}`);
  }
}