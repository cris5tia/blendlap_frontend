import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService, IItemCarrito } from '../../../core/services/carrito.service';
import { CreditoService } from '../../../core/services/credito.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.scss']
})
export class CarritoComponent implements OnInit {

  items: IItemCarrito[] = [];
  enviando  = false;
  exito     = false;
  error     = '';

  plazoSeleccionado = '1_quincena';
  modalConfirmar    = false;

  plazos = [
    { id: '1_semana',    label: '1 Semana',    desc: '7 días'  },
    { id: '1_quincena',  label: '1 Quincena',  desc: '15 días' },
    { id: '2_quincenas', label: '2 Quincenas', desc: '30 días' },
    { id: '1_mes',       label: '1 Mes',       desc: '1 mes'   }
  ];

  imagenUrl = 'http://localhost:3001/images/productos/';

  constructor(
    private carritoService: CarritoService,
    private creditoService: CreditoService,
    private authService:    AuthService,
    private router:         Router
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    if (!usuario) { this.router.navigate(['/login']); return; }
    if (usuario.rol === 'admin' || usuario.rol === 'barbero') { this.router.navigate(['/']); return; }
    this.carritoService.items$.subscribe(items => this.items = items);
  }

  aumentar(id: number): void {
    const item = this.items.find(i => i.producto.id_producto === id);
    if (!item) return;
    this.carritoService.cambiarCantidad(id, item.cantidad + 1);
  }

  disminuir(id: number): void {
    const item = this.items.find(i => i.producto.id_producto === id);
    if (!item) return;
    this.carritoService.cambiarCantidad(id, item.cantidad - 1);
  }

  quitar(id: number): void { this.carritoService.quitar(id); }
  limpiar(): void { this.carritoService.limpiar(); }

  get total(): number { return this.carritoService.total; }
  get cantidad(): number { return this.carritoService.cantidad; }

  getImagen(imagen?: string): string {
    if (imagen) return `${this.imagenUrl}${imagen}`;
    return 'assets/images/no-img.png';
  }

  abrirConfirmar(): void {
    if (!this.items.length) return;
    this.modalConfirmar = true;
    this.error = '';
  }

  confirmarSolicitud(): void {
    this.enviando = true;
    this.error = '';
    const data = {
      plazo: this.plazoSeleccionado,
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
        this.modalConfirmar = false;
        this.exito = true;
        this.carritoService.limpiar();
      },
      error: (err: any) => {
        this.error = err.error?.mensaje || 'Error al enviar la solicitud';
        this.enviando = false;
      }
    });
  }

  irAlHome(): void { this.router.navigate(['/']); }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v || 0);
  }

  plazoLabel(p: string): string {
    return this.plazos.find(x => x.id === p)?.label || p;
  }
}