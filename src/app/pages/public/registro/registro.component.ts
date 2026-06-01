import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent implements OnInit {

  paso: 1 | 2 = 1;

  // Paso 1 — datos del formulario
  nombre = '';
  apellido = '';
  correo_electronico = '';
  telefono = '';
  contrasena = '';
  confirmarContrasena = '';

  // Paso 2 — código de 4 dígitos
  codigoDigitos: string[] = ['', '', '', ''];

  error = '';
  cargando = false;
  mostrarPassword = false;
  mostrarConfirmar = false;
  returnUrl = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
  }

  private redirigir(rol: string): void {
    if (this.returnUrl) { this.router.navigateByUrl(this.returnUrl); return; }
    switch (rol) {
      case 'admin':   this.router.navigate(['/admin/dashboard']); break;
      case 'barbero': this.router.navigate(['/barbero/dashboard']); break;
      default:        this.router.navigate(['/cliente/mis-citas']);
    }
  }

  // ── Paso 1: enviar código ────────────────────────────────────────────────

  validarContrasena(c: string): string | null {
    if (c.length < 8)                           return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(c))                       return 'Debe tener al menos una mayúscula';
    if (!/[a-z]/.test(c))                       return 'Debe tener al menos una minúscula';
    if (!/[0-9]/.test(c))                       return 'Debe tener al menos un número';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(c))     return 'Debe tener al menos un carácter especial';
    return null;
  }

  validarCorreo(correo: string): boolean {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correo);
  }

  registro(): void {
    if (!this.nombre || !this.apellido || !this.correo_electronico || !this.contrasena || !this.confirmarContrasena) {
      this.error = 'Por favor completa todos los campos'; return;
    }
    if (!this.validarCorreo(this.correo_electronico)) {
      this.error = 'Ingresa un correo electrónico válido'; return;
    }
    const errPass = this.validarContrasena(this.contrasena);
    if (errPass) { this.error = errPass; return; }
    if (this.contrasena !== this.confirmarContrasena) {
      this.error = 'Las contraseñas no coinciden'; return;
    }

    this.cargando = true;
    this.error = '';

    this.authService.solicitarVerificacionRegistro({
      nombre: this.nombre,
      apellido: this.apellido,
      correo_electronico: this.correo_electronico,
      telefono: this.telefono,
      contrasena: this.contrasena,
      rol: 'cliente'
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.paso = 2;
        setTimeout(() => {
          (document.getElementById('rdig-0') as HTMLInputElement)?.focus();
        }, 100);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.mensaje || 'Error al enviar el código de verificación';
      }
    });
  }

  // ── Paso 2: inputs del código ────────────────────────────────────────────

  get codigoCompleto(): string { return this.codigoDigitos.join(''); }

  trackByIndex(index: number): number { return index; }

  onDigitChange(val: string, index: number): void {
    const clean = val.replace(/\D/g, '').slice(-1);
    if (val !== clean) this.codigoDigitos[index] = clean;
    this.error = '';
    if (clean && index < 3) {
      setTimeout(() => {
        const next = document.getElementById(`rdig-${index + 1}`) as HTMLInputElement;
        next?.focus(); next?.select();
      }, 0);
    }
  }

  onDigitKeydown(e: KeyboardEvent, index: number): void {
    if (e.key === 'Backspace' && !this.codigoDigitos[index] && index > 0) {
      this.codigoDigitos[index - 1] = '';
      setTimeout(() => {
        (document.getElementById(`rdig-${index - 1}`) as HTMLInputElement)?.focus();
      }, 0);
    }
  }

  onPaste(e: ClipboardEvent): void {
    e.preventDefault();
    const digits = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 4).split('');
    digits.forEach((d, i) => { if (i < 4) this.codigoDigitos[i] = d; });
    const lastIdx = Math.min(digits.length, 3);
    setTimeout(() => {
      (document.getElementById(`rdig-${lastIdx}`) as HTMLInputElement)?.focus();
    }, 0);
  }

  verificarCodigo(): void {
    if (this.codigoCompleto.length < 4) {
      this.error = 'Ingresa el código de 4 dígitos completo'; return;
    }
    this.cargando = true;
    this.error = '';

    this.authService.completarRegistro(this.correo_electronico, this.codigoCompleto).subscribe({
      next: (res) => {
        this.cargando = false;
        this.redirigir(res.usuario.rol);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.mensaje || 'Código incorrecto o expirado';
      }
    });
  }

  reenviarCodigo(): void {
    this.codigoDigitos = ['', '', '', ''];
    this.error = '';
    this.paso = 1;
  }

  // ── Helpers de UI ────────────────────────────────────────────────────────

  togglePassword(): void { this.mostrarPassword = !this.mostrarPassword; }
  toggleConfirmar(): void { this.mostrarConfirmar = !this.mostrarConfirmar; }
  tieneMayuscula(): boolean { return /[A-Z]/.test(this.contrasena); }
  tieneNumero(): boolean { return /[0-9]/.test(this.contrasena); }
  tieneEspecial(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.contrasena); }
  tieneLength(): boolean { return this.contrasena.length >= 8; }

  getStrengthClass(): string {
    let score = 0;
    if (this.tieneLength()) score++;
    if (this.tieneMayuscula()) score++;
    if (this.tieneNumero()) score++;
    if (this.tieneEspecial()) score++;
    if (/[a-z]/.test(this.contrasena)) score++;
    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  }
}
