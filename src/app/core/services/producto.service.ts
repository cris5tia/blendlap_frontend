import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IProducto {
  id_producto: number;
  codigo_producto: string;
  nombre_producto: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria: 'barberia' | 'ropa' | 'accesorios' | 'cuidado';
  imagen?: string;
  talla?: string;
  estado: 'activo' | 'inactivo';
}

export interface ICrearProducto {
  codigo_producto: string;
  nombre_producto: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen?: string;
  talla?: string;
}

export interface IMovimiento {
  id_producto: number;
  tipo_movimiento: 'Entrada' | 'Salida';
  cantidad: number;
  motivo?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {

  private url = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<{ ok: boolean; data: IProducto[] }> {
    return this.http.get<{ ok: boolean; data: IProducto[] }>(this.url);
  }

  getById(id: number): Observable<{ ok: boolean; data: IProducto }> {
    return this.http.get<{ ok: boolean; data: IProducto }>(`${this.url}/${id}`);
  }

  getStockBajo(): Observable<{ ok: boolean; total: number; productos: IProducto[] }> {
    return this.http.get<{ ok: boolean; total: number; productos: IProducto[] }>(`${this.url}/stock-bajo`);
  }

  create(data: ICrearProducto): Observable<{ ok: boolean; data: IProducto }> {
    return this.http.post<{ ok: boolean; data: IProducto }>(this.url, data);
  }

  update(id: number, data: Partial<ICrearProducto>): Observable<{ ok: boolean; data: IProducto }> {
    return this.http.put<{ ok: boolean; data: IProducto }>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<{ ok: boolean; mensaje: string }> {
    return this.http.delete<{ ok: boolean; mensaje: string }>(`${this.url}/${id}`);
  }

  registrarMovimiento(data: IMovimiento): Observable<{ ok: boolean; stock_actual: number; alerta_stock_bajo: boolean }> {
    return this.http.post<{ ok: boolean; stock_actual: number; alerta_stock_bajo: boolean }>(`${this.url}/movimiento`, data);
  }

  getMovimientos(id: number): Observable<{ ok: boolean; data: any[] }> {
    return this.http.get<{ ok: boolean; data: any[] }>(`${this.url}/${id}/movimientos`);
  }
  createFormData(data: FormData): Observable<{ ok: boolean; data: IProducto }> {
    return this.http.post<{ ok: boolean; data: IProducto }>(this.url, data);
  }

  updateFormData(id: number, data: FormData): Observable<{ ok: boolean; data: IProducto }> {
    return this.http.put<{ ok: boolean; data: IProducto }>(`${this.url}/${id}`, data);
  }
}