import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IBarbero {
    id_usuario: number;
    nombre: string;
    apellido: string;
    foto?: string;
    titulo?: string;
    descripcion?: string;
    experiencia?: number;
    especialidades?: string;
    comision?: number;
    estado: string;
    total_agendamientos: number;
    promedio_estrellas: number;
    total_resenas: number;
}

@Injectable({ providedIn: 'root' })
export class BarberoService {

    private url = `${environment.apiUrl}/usuarios`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<{ ok: boolean; data: IBarbero[] }> {
        return this.http.get<{ ok: boolean; data: IBarbero[] }>(`${this.url}/barberos`);
    }

    crear(data: FormData): Observable<{ ok: boolean; data: IBarbero }> {
        return this.http.post<{ ok: boolean; data: IBarbero }>(`${this.url}/barberos`, data);
    }

    actualizar(id: number, data: any): Observable<{ ok: boolean; data: IBarbero }> {
        return this.http.put<{ ok: boolean; data: IBarbero }>(`${this.url}/barberos/${id}`, data);
    }

    eliminar(id: number): Observable<{ ok: boolean; mensaje: string }> {
        return this.http.delete<{ ok: boolean; mensaje: string }>(`${this.url}/barberos/${id}`);
    }

    uploadFoto(file: File, idBarbero?: number): Observable<{ ok: boolean; nombreArchivo: string }> {
        const formData = new FormData();
        formData.append('foto', file);
        if (idBarbero) formData.append('id_barbero', String(idBarbero));
        return this.http.post<{ ok: boolean; nombreArchivo: string }>(`${this.url}/barberos/upload-foto`, formData);
    }
    getAllAdmin(): Observable<{ ok: boolean; data: IBarbero[] }> {
        return this.http.get<{ ok: boolean; data: IBarbero[] }>(`${this.url}/barberos/todos`);
    }

    reactivar(id: number): Observable<{ ok: boolean; mensaje: string }> {
        return this.http.put<{ ok: boolean; mensaje: string }>(`${this.url}/barberos/${id}/reactivar`, {});
    }
}