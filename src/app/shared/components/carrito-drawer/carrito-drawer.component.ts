import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService, IItemCarrito } from '../../../core/services/carrito.service';
import { CreditoService } from '../../../core/services/credito.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-carrito-drawer',
  templateUrl: './carrito-drawer.component.html',
  styleUrls: ['./carrito-drawer.component.scss']
})
export class CarritoDrawerComponent implements OnInit {

  abierto   = false;
  items:    IItemCarrito[] = [];
  enviando  = false;
  exito     = false;
  error     = '';

  plazoSeleccionado = '1_quincena';

  plazos = [
    { id: '1_semana',    label: '1 Sem',    desc: '7 días'  },
    { id: '1_quincena',  label: '1 Quinc',  desc: '15 días' },
    { id: '2_quincenas', label: '2 Quinc',  desc: '30 días' },
    { id: '1_mes',       label: '1 Mes',    desc: '1 mes'   }
  ];

  constructor(
    private carritoService: CarritoService,
    private creditoService: CreditoService,
    private authService:    AuthService,
    private router:         Router
  ) {}

  ngOnInit(): void {
    this.carritoService.modal$.subscribe(v => this.abierto = v);
    this.carritoService.items$.subscribe(items => this.items = items);
  }

  cerrar(): void { this.carritoService.cerrarModal(); }

  aumentar(id: number): void {
    const item = this.items.find(i => i.producto.id_producto === id);
    if (item) this.carritoService.cambiarCantidad(id, item.cantidad + 1);
  }

  disminuir(id: number): void {
    const item = this.items.find(i => i.producto.id_producto === id);
    if (item) this.carritoService.cambiarCantidad(id, item.cantidad - 1);
  }

  quitar(id: number): void { this.carritoService.quitar(id); }

  get total(): number { return this.carritoService.total; }

  getImagen(imagen?: string): string {
    if (!imagen) return 'assets/images/no-img.png';
    if (imagen.startsWith('data:') || imagen.startsWith('http') || imagen.startsWith('assets/')) return imagen;
    return `http://localhost:3001/images/productos/${imagen}`;
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v || 0);
  }

  irAlCheckout(): void {
    const usuario = this.authService.getUsuario();
    if (!usuario) {
      this.cerrar();
      this.router.navigate(['/login']);
      return;
    }
    this.cerrar();
    this.router.navigate(['/checkout']);
  }

  solicitar(): void {
    const usuario = this.authService.getUsuario();
    if (!usuario) {
      this.cerrar();
      this.router.navigate(['/login']);
      return;
    }
    if (!this.items.length) return;
    this.enviando = true;
    this.error    = '';

    const data = {
      plazo:     this.plazoSeleccionado,
      productos: this.items.map(i => ({
        id_producto:     i.producto.id_producto,
        cantidad:        i.cantidad,
        talla:           i.talla || null,
        precio_unitario: Number(i.producto.precio),
        subtotal:        Number(i.producto.precio) * i.cantidad
      }))
    };

    this.creditoService.solicitarCredito(data).subscribe({
      next: () => {
        this.enviando = false;
        this.exito    = true;
        this.carritoService.limpiar();
        setTimeout(() => {
          this.exito = false;
          this.cerrar();
        }, 3500);
      },
      error: (err: any) => {
        this.error    = err.error?.mensaje || 'Error al enviar la solicitud';
        this.enviando = false;
      }
    });
  }
}
