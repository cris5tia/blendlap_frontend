import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface IFiltroReporte {
  fechaInicio: string;
  fechaFin: string;
  id_barbero?: number;
}

export interface IKPIs {
  ingresos_total: number;
  ingresos_servicios: number;
  ingresos_productos: number;
  total_gastos: number;
  total_comisiones_barbero: number;
  ganancia_neta: number;
  cantidad_ventas: number;
  reservas_total: number;
  reservas_completadas: number;
  reservas_pendientes: number;
  reservas_canceladas: number;
  clientes_nuevos: number;
  creditos_pendientes: number;
  creditos_activos: number;
  monto_creditos_pendiente: number;
  monto_creditos_activos: number;
}

export interface IVentaDia    { dia: string; cantidad: number; total: number; }
export interface IVentaHora   { hora: number; cantidad: number; total: number; }
export interface IMetodoPago  { metodo_pago: string; cantidad: number; total: number; }
export interface ITopServicio { nombre_servicio: string; veces_solicitado: number; total_generado: number; }
export interface ITopProducto { nombre_producto: string; cantidad_vendida: number; total_generado: number; }
export interface ITopCliente  { cliente: string; foto?: string; total_reservas: number; total_gastado: number; }
export interface IBarberoReporte {
  barbero: string; foto?: string; titulo?: string; comision: number;
  total_reservas: number; total_servicios: number;
  comision_barbero: number; comision_barberia: number;
}
export interface IGastoCategoria { categoria: string; cantidad: number; total: number; }
export interface IGastoDia       { dia: string; total: number; }
export interface IReservaDia     { dia: string; estado: string; cantidad: number; }
export interface ICreditoEstado  { estado: string; cantidad: number; monto_total: number; saldo_pendiente: number; }

export interface IReporteCompleto {
  periodo: { fechaInicio: string; fechaFin: string };
  kpis: IKPIs;
  ventas_por_dia: IVentaDia[];
  ventas_por_hora: IVentaHora[];
  metodos_pago: IMetodoPago[];
  top_servicios: ITopServicio[];
  top_productos: ITopProducto[];
  barberos: IBarberoReporte[];
  servicios_por_barbero: any[];
  gastos_por_categoria: IGastoCategoria[];
  gastos_por_dia: IGastoDia[];
  top_clientes: ITopCliente[];
  reservas_por_dia: IReservaDia[];
  creditos: { estadisticas: ICreditoEstado[]; abonos_recientes: any[] };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ReporteService {

  private url = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) { }

  getCompleto(filtro: IFiltroReporte): Observable<{ ok: boolean; data: IReporteCompleto }> {
    const params: any = { fechaInicio: filtro.fechaInicio, fechaFin: filtro.fechaFin };
    if (filtro.id_barbero) params.id_barbero = String(filtro.id_barbero);
    return this.http.get<{ ok: boolean; data: IReporteCompleto }>(`${this.url}/completo`, { params });
  }

  descargarPDF(filtro: IFiltroReporte): Observable<Blob> {
    const params: any = { fechaInicio: filtro.fechaInicio, fechaFin: filtro.fechaFin };
    if (filtro.id_barbero) params.id_barbero = String(filtro.id_barbero);
    return this.http.get(`${this.url}/pdf`, { params, responseType: 'blob' });
  }

  descargarExcel(filtro: IFiltroReporte): Observable<Blob> {
    const params: any = { fechaInicio: filtro.fechaInicio, fechaFin: filtro.fechaFin };
    if (filtro.id_barbero) params.id_barbero = String(filtro.id_barbero);
    return this.http.get(`${this.url}/excel`, { params, responseType: 'blob' });
  }

  // ── Presets de fecha ──────────────────────────────────────────────────────

  static presetHoy(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date().toISOString().split('T')[0];
    return { fechaInicio: hoy, fechaFin: hoy };
  }

  static presetSemana(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const dia = hoy.getDay();
    const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1));
    return { fechaInicio: lunes.toISOString().split('T')[0], fechaFin: hoy.toISOString().split('T')[0] };
  }

  static presetMes(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { fechaInicio: inicio.toISOString().split('T')[0], fechaFin: hoy.toISOString().split('T')[0] };
  }

  static presetAno(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), 0, 1);
    return { fechaInicio: inicio.toISOString().split('T')[0], fechaFin: hoy.toISOString().split('T')[0] };
  }

  static presetMesAnterior(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const fin    = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    return { fechaInicio: inicio.toISOString().split('T')[0], fechaFin: fin.toISOString().split('T')[0] };
  }
}
