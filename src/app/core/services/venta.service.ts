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
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  servicio_realizado?: string;
  porcentaje_barbero?: number;
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
}