import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ICredito {
  id_credito:        number;
  id_cliente?:       number | null;
  nombre_cliente:    string;
  telefono_cliente:  string;
  monto_total:       number;
  saldo_pendiente:   number;
  plazo:             string;
  fecha_vencimiento: string;
  estado:            'pendiente' | 'activo' | 'pagado' | 'vencido';
  observaciones?:    string;
  fecha_creacion:    string;
  productos_nombres?: string;
  productos?:        ICreditoProducto[];
  abonos?:           ICreditoAbono[];
}

export interface ICreditoProducto {
  id_producto:      number;
  cantidad:         number;
  precio_unitario:  number;
  subtotal:         number;
  nombre_producto?: string;
  imagen?:          string;
  codigo_producto?: string;
}

export interface ICreditoAbono {
  id_abono:     number;
  monto:        number;
  fecha:        string;
  metodo_pago:  string;
  nombre_admin: string;
  observacion?: string;
}

export interface ICrearCreditoAdmin {
  nombre_cliente:   string;
  telefono_cliente: string;
  plazo:            string;
  observaciones?:   string;
  productos: {
    id_producto:     number;
    cantidad:        number;
    precio_unitario: number;
    subtotal:        number;
  }[];
}

export interface ISolicitarCredito {
  plazo:         string;
  observaciones?: string;
  productos: {
    id_producto:     number;
    cantidad:        number;
    precio_unitario: number;
    subtotal:        number;
  }[];
}

export interface IRegistrarAbono {
  id_credito:   number;
  monto:        number;
  metodo_pago:  'efectivo' | 'nequi' | 'otro';
  observacion?: string;
}

@Injectable({ providedIn: 'root' })
export class CreditoService {

  private url = `${environment.apiUrl}/creditos`;

  constructor(private http: HttpClient) {}

  getAll(filtros?: { estado?: string; busqueda?: string }):
    Observable<{ ok: boolean; data: ICredito[] }> {
    const params: any = {};
    if (filtros?.estado)   params.estado   = filtros.estado;
    if (filtros?.busqueda) params.busqueda = filtros.busqueda;
    return this.http.get<{ ok: boolean; data: ICredito[] }>(this.url, { params });
  }

  getById(id: number): Observable<{ ok: boolean; data: ICredito }> {
    return this.http.get<{ ok: boolean; data: ICredito }>(`${this.url}/${id}`);
  }

  // Admin crea en local → activo directo
  crearAdmin(data: ICrearCreditoAdmin): Observable<{ ok: boolean; data: ICredito }> {
    return this.http.post<{ ok: boolean; data: ICredito }>(`${this.url}/admin`, data);
  }

  // Cliente solicita desde home → pendiente
  solicitarCredito(data: ISolicitarCredito): Observable<{ ok: boolean; data: ICredito }> {
    return this.http.post<{ ok: boolean; data: ICredito }>(`${this.url}/solicitar`, data);
  }

  aprobar(id: number): Observable<{ ok: boolean; data: ICredito }> {
    return this.http.put<{ ok: boolean; data: ICredito }>(`${this.url}/${id}/aprobar`, {});
  }

  rechazar(id: number): Observable<{ ok: boolean; mensaje: string }> {
    return this.http.put<{ ok: boolean; mensaje: string }>(`${this.url}/${id}/rechazar`, {});
  }

  abonar(data: IRegistrarAbono): Observable<{ ok: boolean; data: ICredito }> {
    return this.http.post<{ ok: boolean; data: ICredito }>(`${this.url}/abonar`, data);
  }
}