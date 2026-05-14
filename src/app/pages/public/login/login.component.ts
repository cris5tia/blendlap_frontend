import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  correo = '';
  contrasena = '';
  error = '';
  cargando = false;
  mostrarPassword = false;
  returnUrl = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;
    this.inicializarGoogle();
  }

  private redirigir(rol: string): void {
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }
    switch (rol) {
      case 'admin': this.router.navigate(['/admin/dashboard']); break;
      case 'barbero': this.router.navigate(['/barbero/agenda']); break;
      case 'cliente': this.router.navigate(['/']); break;
      default: this.router.navigate(['/']);
    }
  }

  inicializarGoogle(): void {
    setTimeout(() => {
      google.accounts.id.initialize({
        client_id: '344413729629-a7jqa783l9pmen2m3vosme2cf4okh536.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleLogin(response)
      });
      google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signin_with', locale: 'es' }
      );
    }, 500);
  }

  handleGoogleLogin(response: any): void {
    this.cargando = true;
    this.error = '';
    this.authService.loginConGoogle(response.credential).subscribe({
      next: (res) => {
        this.cargando = false;
        this.redirigir(res.usuario.rol);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.mensaje || 'Error al iniciar sesión con Google';
      }
    });
  }

  validarCorreo(correo: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(correo);
  }

  login(): void {
    if (!this.correo || !this.contrasena) {
      this.error = 'Por favor completa todos los campos';
      return;
    }
    if (!this.validarCorreo(this.correo)) {
      this.error = 'Ingresa un correo electrónico válido';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.authService.login(this.correo, this.contrasena).subscribe({
      next: (res) => {
        this.cargando = false;
        this.redirigir(res.usuario.rol);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.mensaje || 'Credenciales inválidas';
      }
    });
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}