import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface IUsuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  rol: 'admin' | 'barbero' | 'cliente';
  telefono?: string;
  foto?: string;
}

export interface ILoginResponse {
  ok: boolean;
  token: string;
  usuario: IUsuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;
  private usuarioSubject = new BehaviorSubject<IUsuario | null>(null);
  usuario$ = this.usuarioSubject.asObservable();

  private logoutRequestedSubject = new Subject<void>();
  logoutRequested$ = this.logoutRequestedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.cargarUsuario();
  }

  // Cargar usuario desde localStorage al iniciar
  private cargarUsuario(): void {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    if (token && usuario) {
      this.usuarioSubject.next(JSON.parse(usuario));
    }
  }

  // Login
  login(correo_electronico: string, contrasena: string): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(`${this.apiUrl}/login`, {
      correo_electronico,
      contrasena
    }).pipe(
      tap(res => {
        if (res.ok) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
          this.usuarioSubject.next(res.usuario);
        }
      })
    );
  }

  // Registro
  registro(data: any): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(`${this.apiUrl}/registro`, data).pipe(
      tap(res => {
        if (res.ok) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
          this.usuarioSubject.next(res.usuario);
        }
      })
    );
  }

  requestLogout(): void {
    this.logoutRequestedSubject.next();
  }

  // Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioSubject.next(null);
    this.router.navigate(['/']);
  }

  // Getters
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsuario(): IUsuario | null {
    return this.usuarioSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRol(): string | null {
    return this.getUsuario()?.rol || null;
  }
  solicitarVerificacionRegistro(data: any): Observable<{ ok: boolean; mensaje: string }> {
    return this.http.post<{ ok: boolean; mensaje: string }>(
      `${this.apiUrl}/solicitar-verificacion-registro`,
      data
    );
  }

  completarRegistro(correo_electronico: string, codigo: string): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(
      `${this.apiUrl}/completar-registro`,
      { correo_electronico, codigo }
    ).pipe(
      tap(res => {
        if (res.ok) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
          this.usuarioSubject.next(res.usuario);
        }
      })
    );
  }

  solicitarRecuperacion(correo_electronico: string): Observable<{ ok: boolean; mensaje: string }> {
    return this.http.post<{ ok: boolean; mensaje: string }>(
      `${this.apiUrl}/solicitar-recuperacion`,
      { correo_electronico }
    );
  }

  resetearPassword(correo_electronico: string, codigo: string, nueva_contrasena: string): Observable<{ ok: boolean; mensaje: string }> {
    return this.http.post<{ ok: boolean; mensaje: string }>(
      `${this.apiUrl}/resetear-password`,
      { correo_electronico, codigo, nueva_contrasena }
    );
  }

  obtenerMiPerfil(): Observable<{ ok: boolean; data: IUsuario }> {
    return this.http.get<{ ok: boolean; data: IUsuario }>(`${this.apiUrl}/mi-perfil`);
  }

  actualizarMiPerfil(formData: FormData): Observable<{ ok: boolean; data: IUsuario }> {
    return this.http.put<{ ok: boolean; data: IUsuario }>(`${this.apiUrl}/mi-perfil`, formData);
  }

  actualizarUsuarioLocal(datos: Partial<IUsuario>): void {
    const actual = this.usuarioSubject.value;
    if (!actual) return;
    const actualizado = { ...actual, ...datos };
    localStorage.setItem('usuario', JSON.stringify(actualizado));
    this.usuarioSubject.next(actualizado);
  }

  // Google Login
loginConGoogle(token: string): Observable<ILoginResponse> {
  return this.http.post<ILoginResponse>(`${this.apiUrl}/google`, { token }).pipe(
    tap(res => {
      if (res.ok) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
        this.usuarioSubject.next(res.usuario);
      }
    })
  );
}
}
