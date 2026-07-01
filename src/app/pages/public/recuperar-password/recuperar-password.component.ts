import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.scss']
})
export class RecuperarPasswordComponent {

  paso: 1 | 2 | 3 = 1;

  correo = '';
  codigoDigitos: string[] = ['', '', '', '', '', ''];
  nuevaContrasena = '';
  confirmarContrasena = '';
  mostrarNueva = false;
  mostrarConfirmar = false;

  cargando = false;
  error = '';
  exito = false;

  constructor(private authService: AuthService, private router: Router) {}

  get codigoCompleto(): string {
    return this.codigoDigitos.join('');
  }

  // ─── Paso 1: Enviar código ────────────────────────────────
  enviarCodigo(): void {
    if (!this.correo || !this.validarCorreo(this.correo)) {
      this.error = 'Ingresa un correo electrónico válido';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.authService.solicitarRecuperacion(this.correo).subscribe({
      next: () => {
        this.cargando = false;
        this.paso = 2;
        setTimeout(() => {
          const first = document.getElementById('digit-0') as HTMLInputElement;
          first?.focus();
        }, 100);
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'No existe una cuenta con ese correo';
        this.cargando = false;
      }
    });
  }

  // ─── Paso 2: Inputs del código ───────────────────────────
  trackByIndex(index: number): number { return index; }

  onDigitChange(val: string, index: number): void {
    const clean = val.replace(/\D/g, '').slice(-1);
    if (val !== clean) {
      this.codigoDigitos[index] = clean;
    }
    this.error = '';
    if (clean && index < 5) {
      setTimeout(() => {
        const next = document.getElementById(`digit-${index + 1}`) as HTMLInputElement;
        next?.focus();
        next?.select();
      }, 0);
    }
  }

  onDigitKeydown(e: KeyboardEvent, index: number): void {
    if (e.key === 'Backspace') {
      if (!this.codigoDigitos[index] && index > 0) {
        this.codigoDigitos[index - 1] = '';
        setTimeout(() => {
          const prev = document.getElementById(`digit-${index - 1}`) as HTMLInputElement;
          prev?.focus();
        }, 0);
      }
    }
  }

  onPaste(e: ClipboardEvent): void {
    e.preventDefault();
    const text = e.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach((d, i) => { if (i < 6) this.codigoDigitos[i] = d; });
    const lastIdx = Math.min(digits.length, 5);
    setTimeout(() => {
      const last = document.getElementById(`digit-${lastIdx}`) as HTMLInputElement;
      last?.focus();
    }, 0);
  }

  verificarCodigo(): void {
    if (this.codigoCompleto.length < 6) {
      this.error = 'Ingresa el código de 6 dígitos completo';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.authService.verificarCodigoRecuperacion(this.correo, this.codigoCompleto).subscribe({
      next: () => {
        this.cargando = false;
        this.paso = 3;
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Código inválido o expirado';
        this.cargando = false;
      }
    });
  }

  reenviarCodigo(): void {
    this.codigoDigitos = ['', '', '', '', '', ''];
    this.error = '';
    this.paso = 1;
  }

  // ─── Paso 3: Nueva contraseña ─────────────────────────────
  resetearPassword(): void {
    if (!this.nuevaContrasena || this.nuevaContrasena.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }
    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.authService.resetearPassword(this.correo, this.codigoCompleto, this.nuevaContrasena).subscribe({
      next: () => {
        this.cargando = false;
        this.exito = true;
        setTimeout(() => this.router.navigate(['/login']), 2800);
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Código inválido o expirado. Vuelve a solicitar uno.';
        this.cargando = false;
      }
    });
  }

  private validarCorreo(correo: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  }
}
