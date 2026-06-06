import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IVenta {
  id_venta: number;
  id_reserva?: number;
  id_cajero: number;
  nombre_cajero?: string;
  fecha: string;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'otro';
  total: number;
  detalles?: IDetalleVenta[];
}

export interface IDetalleVenta {
  id_detalle: number;
  id_producto: number;
  nombre_producto?: string;
  imagen?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  servicio_realizado?: string;
  porcentaje_barbero?: number;
}

export interface IAbonoDia {
  id_abono:         number;
  abono_monto:      number;
  abono_metodo:     string;
  abono_fecha:      string;
  nombre_cliente:   string;
  monto_total:      number;
  saldo_pendiente:  number;
  credito_estado:   string;
  productos_nombres: string;
}

export interface ICierreCaja {
  fecha: string;
  total_ventas: number;
  total_efectivo: number;
  total_tarjeta: number;
  total_transferencia: number;
  total_nequi: number;
  total_otro: number;
  cantidad_ventas: number;
  abonos_del_dia?:    IAbonoDia[];
  total_abonado_hoy?: number;
}

@Injectable({ providedIn: 'root' })
export class VentaService {

  private url = `${environment.apiUrl}/ventas`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ ok: boolean; data: IVenta[] }> {
    return this.http.get<{ ok: boolean; data: IVenta[] }>(this.url);
  }

  getById(id: number): Observable<{ ok: boolean; data: IVenta }> {
    return this.http.get<{ ok: boolean; data: IVenta }>(`${this.url}/${id}`);
  }

  cierreCaja(fecha: string): Observable<{ ok: boolean; data: ICierreCaja }> {
    return this.http.get<{ ok: boolean; data: ICierreCaja }>(`${this.url}/cierre-caja?fecha=${fecha}`);
  }

  create(body: {
    metodo_pago: string;
    detalles: { id_producto: number; cantidad: number; precio_unitario: number }[];
  }): Observable<{ ok: boolean; data: IVenta }> {
    return this.http.post<{ ok: boolean; data: IVenta }>(this.url, body);
  }
}