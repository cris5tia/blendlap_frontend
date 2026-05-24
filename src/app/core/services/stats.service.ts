import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IStatsBarbero {
  citasMes: number;
  ingresosMes: number;
  comisionMes: number;
  citasTotal: number;
  clientesAtendidos: number;
  clientesRecurrentes: number;
  cancelacionesMes: number;
  promedio_estrellas: string;
  total_resenas: number;
  topServicio: string;
  experiencia: number;
  comision: number;
  topClientes: { nombre_cliente: string; citas: number; ingresos: number }[];
  distribucionServicios: { nombre_servicio: string; total: number }[];
  citasPorDiaMes: { dia: number; citas: number; ingresos: number }[];
}

@Injectable({ providedIn: 'root' })
export class StatsService {

  private url = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  getStatsBarbero(): Observable<{ ok: boolean; data: IStatsBarbero }> {
    return this.http.get<{ ok: boolean; data: IStatsBarbero }>(`${this.url}/barbero`);
  }
}