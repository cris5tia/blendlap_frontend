import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IIniciarPagoPayload {
  items: {
    id_producto: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    talla?: string;
  }[];
  total: number;
}

export interface IIniciarPagoResponse {
  ok: boolean;
  referencia: string;
  amountInCents: number;
  publicKey: string;
  integrityHash: string;
  currency: string;
  redirectUrl: string;
}

export interface IVerificarPagoResponse {
  ok: boolean;
  estado: string;
  referencia?: string;
  idVenta?: number;
  mensaje?: string;
}

export interface IItemCompra {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  talla?: string;
}

export interface ICompra {
  id_pago: number;
  referencia: string;
  total: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'error';
  items: IItemCompra[];
  wompi_transaction_id: string | null;
  id_venta: number | null;
  fecha_creacion: string;
}

@Injectable({ providedIn: 'root' })
export class PagoService {

  private api = `${environment.apiUrl}/pagos`;

  constructor(private http: HttpClient) {}

  iniciarPago(payload: IIniciarPagoPayload): Observable<IIniciarPagoResponse> {
    return this.http.post<IIniciarPagoResponse>(`${this.api}/iniciar`, payload);
  }

  verificarPago(transactionId: string): Observable<IVerificarPagoResponse> {
    return this.http.get<IVerificarPagoResponse>(`${this.api}/verificar/${transactionId}`);
  }

  getMisCompras(): Observable<{ ok: boolean; data: ICompra[] }> {
    return this.http.get<{ ok: boolean; data: ICompra[] }>(`${this.api}/mis-compras`);
  }
}
