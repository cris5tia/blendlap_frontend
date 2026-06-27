import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ICliente {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  telefono?: string;
  observaciones?: string;
  estado: string;
  fecha_creacion: string;
  total_cortes: number;
  cortes_ciclo: number;
  cortes_para_descuento: number;
  servicio_frecuente?: string | null;
  foto?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {

  private url = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ ok: boolean; data: ICliente[] }> {
    return this.http.get<{ ok: boolean; data: ICliente[] }>(this.url);
  }

  buscar(termino: string): Observable<{ ok: boolean; data: ICliente[] }> {
    return this.http.get<{ ok: boolean; data: ICliente[] }>(`${this.url}/buscar?termino=${termino}`);
  }

  getHistorial(id: number): Observable<{ ok: boolean; data: any }> {
    return this.http.get<{ ok: boolean; data: any }>(`${this.url}/${id}/historial`);
  }
}