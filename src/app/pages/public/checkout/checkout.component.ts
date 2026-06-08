import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { CarritoService, IItemCarrito } from '../../../core/services/carrito.service';
import { PagoService } from '../../../core/services/pago.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  items: IItemCarrito[] = [];
  cargando      = false;
  iniciando     = false;
  error         = '';

  constructor(
    private carritoService: CarritoService,
    private pagoService:    PagoService,
    private authService:    AuthService,
    private router:         Router,
    private location:       Location
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    this.items = this.carritoService.items;
    if (this.items.length === 0) {
      this.router.navigate(['/carrito']);
    }
  }

  get total(): number { return this.carritoService.total; }
  get totalCents(): number { return Math.round(this.total * 100); }

  formatCOP(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value);
  }

  volver(): void { this.location.back(); }
  volverAlCarrito(): void { this.router.navigate(['/carrito']); }

  pagarConWompi(): void {
    this.iniciando = true;
    this.error = '';

    const payload = {
      items: this.items.map(i => ({
        id_producto:     i.producto.id_producto!,
        nombre:          i.producto.nombre_producto,
        cantidad:        i.cantidad,
        precio_unitario: Number(i.producto.precio),
        subtotal:        Number(i.producto.precio) * i.cantidad,
        talla:           i.talla,
      })),
      total: this.total,
    };

    this.pagoService.iniciarPago(payload).subscribe({
      next: (data) => {
        // Guardar referencia en sessionStorage para el resultado
        sessionStorage.setItem('wompi_referencia', data.referencia);

        // Redirigir a Wompi checkout
        // Nota: signature:integrity, customer-data:email, customer-data:full-name
        // deben tener el ':' sin codificar — no usar URLSearchParams para las claves
        const usuario = this.authService.getUsuario();

        const partes: string[] = [
          `public-key=${encodeURIComponent(data.publicKey)}`,
          `currency=${encodeURIComponent(data.currency)}`,
          `amount-in-cents=${data.amountInCents}`,
          `reference=${encodeURIComponent(data.referencia)}`,
          `signature:integrity=${encodeURIComponent(data.integrityHash)}`,
          `redirect-url=${encodeURIComponent(data.redirectUrl)}`,
        ];

        if (usuario) {
          partes.push(`customer-data:email=${encodeURIComponent(usuario.correo_electronico)}`);
          partes.push(`customer-data:full-name=${encodeURIComponent(usuario.nombre + ' ' + usuario.apellido)}`);
        }

        window.location.href = `https://checkout.wompi.co/p/?${partes.join('&')}`;
      },
      error: (err) => {
        this.iniciando = false;
        this.error = err.error?.mensaje || 'Error al iniciar el pago. Intenta nuevamente.';
      }
    });
  }
}
