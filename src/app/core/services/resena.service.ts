import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IResena {
  id_resena?: number;
  id_cliente?: number;
  id_barbero: number;
  id_reserva: number;
  calificacion: number;
  comentario?: string;
  fecha?: string;
  nombre_cliente?: string;
}

@Injectable({ providedIn: 'root' })
export class ResenaService {

  private url = `${environment.apiUrl}/resenas`;

  constructor(private http: HttpClient) {}

  getByBarbero(id_barbero: number): Observable<{ ok: boolean; data: IResena[] }> {
    return this.http.get<{ ok: boolean; data: IResena[] }>(`${this.url}/barbero/${id_barbero}`);
  }

  crear(data: IResena): Observable<{ ok: boolean; id_resena: number }> {
    return this.http.post<{ ok: boolean; id_resena: number }>(this.url, data);
  }
}