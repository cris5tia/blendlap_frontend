import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IServicio {
  id_servicio?: number;
  nombre_servicio: string;
  descripcion: string;
  precio: number;
  duracion: number;
  imagen?: string;
  categoria?: string;
}

@Injectable({ providedIn: 'root' })
export class ServicioService {

  private url = `${environment.apiUrl}/servicios`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ ok: boolean; data: IServicio[] }> {
    return this.http.get<{ ok: boolean; data: IServicio[] }>(this.url);
  }

  create(data: Omit<IServicio, 'id_servicio'>): Observable<{ ok: boolean; data: IServicio }> {
    return this.http.post<{ ok: boolean; data: IServicio }>(this.url, data);
  }

  delete(id: number): Observable<{ ok: boolean; mensaje: string }> {
  return this.http.delete<{ ok: boolean; mensaje: string }>(`${this.url}/${Number(id)}`);
}

update(id: number, data: Partial<IServicio>): Observable<{ ok: boolean; data: IServicio }> {
  return this.http.put<{ ok: boolean; data: IServicio }>(`${this.url}/${Number(id)}`, data);
}
uploadImagen(file: File): Observable<{ ok: boolean; nombreArchivo: string }> {
  const formData = new FormData();
  formData.append('imagen', file);
  return this.http.post<{ ok: boolean; nombreArchivo: string }>(`${this.url}/upload-imagen`, formData);
}
getImagenesDisponibles(): Observable<string[]> {
  return this.http.get<string[]>('assets/images/servicios/imagenes.json');
}
}