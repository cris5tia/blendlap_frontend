import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IGasto {
  id_gasto?: number;
  nombre: string;
  categoria: string;
  monto: number;
  fecha: string;
  descripcion?: string;
  fecha_creacion?: string;
}
export interface IEstadisticasGasto {
  total: number;
  cantidad: number;
  promedio: number;
  gasto_mas_alto: { nombre: string; monto: number } | null;
  por_categoria: { categoria: string; total: number; cantidad: number }[];
  evolucion: { dia: string; total: number }[];
  recientes: IGasto[];
}

@Injectable({ providedIn: 'root' })
export class GastoService {

  private url = `${environment.apiUrl}/gastos`;

  constructor(private http: HttpClient) { }

  getAll(filtros?: { desde?: string; hasta?: string; categoria?: string }): Observable<{ ok: boolean; data: IGasto[] }> {
    let params: any = {};
    if (filtros?.desde) params.desde = filtros.desde;
    if (filtros?.hasta) params.hasta = filtros.hasta;
    if (filtros?.categoria) params.categoria = filtros.categoria;
    return this.http.get<{ ok: boolean; data: IGasto[] }>(this.url, { params });
  }

  crear(data: IGasto): Observable<{ ok: boolean; id_gasto: number }> {
    return this.http.post<{ ok: boolean; id_gasto: number }>(this.url, data);
  }

  actualizar(id: number, data: Partial<IGasto>): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.url}/${id}`, data);
  }

  eliminar(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.url}/${id}`);
  }
  getEstadisticas(filtros?: { desde?: string; hasta?: string }):
  Observable<{ ok: boolean; data: IEstadisticasGasto }> {
  const params: any = {};
  if (filtros?.desde) params.desde = filtros.desde;
  if (filtros?.hasta) params.hasta = filtros.hasta;
  return this.http.get<{ ok: boolean; data: IEstadisticasGasto }>(
    `${this.url}/estadisticas`, { params }
  );
}
}