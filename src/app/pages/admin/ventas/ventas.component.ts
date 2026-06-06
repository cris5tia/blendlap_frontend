import { Component, OnInit } from '@angular/core';
import { VentaService, IVenta } from '../../../core/services/venta.service';
import { ProductoService, IProducto } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';

export type TipoVista = 'todos' | 'servicios' | 'productos';

interface ICarritoItem {
  producto: IProducto;
  cantidad: number;
}

@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.scss']
})
export class VentasComponent implements OnInit {

  ventas:         IVenta[] = [];
  ventasFiltradas:IVenta[] = [];
  ventaDetalle:   IVenta | null = null;

  cargando = true;

  filtroFecha  = '';
  filtroMetodo = '';
  busqueda     = '';

  tipoVista: TipoVista = 'todos';
  mostrarDetalle = false;

  metodos      = ['efectivo', 'tarjeta', 'transferencia', 'nequi', 'otro'];
  metodosModal = ['efectivo', 'transferencia'];

  // ── Nueva venta presencial ──────────────────────────────────
  modalNuevaVenta  = false;
  productosAll:    IProducto[] = [];
  productosBusq:   IProducto[] = [];
  busquedaProducto = '';
  carrito:         ICarritoItem[] = [];
  metodoPagoNueva = '';
  guardando        = false;
  errorNueva       = '';
  exitoNueva       = false;

  constructor(
    private ventaService:    VentaService,
    private productoService: ProductoService,
    private toastService:    ToastService
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.ventaService.getAll().subscribe({
      next: (res) => { this.ventas = res.data; this.filtrar(); this.cargando = false; },
      error: () => { this.toastService.error('Error al cargar ventas'); this.cargando = false; }
    });
  }

  filtrar(): void {
    let lista = [...this.ventas];
    if (this.filtroFecha)  lista = lista.filter(v => v.fecha?.startsWith(this.filtroFecha));
    if (this.filtroMetodo) lista = lista.filter(v => v.metodo_pago === this.filtroMetodo);
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(v =>
        v.nombre_cajero?.toLowerCase().includes(q) || String(v.id_venta).includes(q)
      );
    }
    this.ventasFiltradas = lista;
  }

  cambiarVista(tipo: TipoVista): void { this.tipoVista = tipo; }

  get ventasServicios(): IVenta[] { return this.ventasFiltradas.filter(v => !!v.id_reserva); }
  get ventasProductos(): IVenta[] { return this.ventasFiltradas.filter(v => !v.id_reserva); }

  get listaActiva(): IVenta[] {
    if (this.tipoVista === 'servicios') return this.ventasServicios;
    if (this.tipoVista === 'productos') return this.ventasProductos;
    return this.ventasFiltradas;
  }

  get totalFiltrado(): number          { return this.listaActiva.reduce((s, v) => s + Number(v.total), 0); }
  get totalServiciosFiltrado(): number  { return this.ventasServicios.reduce((s, v) => s + Number(v.total), 0); }
  get totalProductosFiltrado(): number  { return this.ventasProductos.reduce((s, v) => s + Number(v.total), 0); }

  // ── Ver detalle ──────────────────────────────────────────────
  verDetalle(id: number): void {
    this.ventaDetalle  = null;
    this.mostrarDetalle = true;
    this.ventaService.getById(id).subscribe({
      next:  (res) => this.ventaDetalle = res.data,
      error: ()    => this.toastService.error('Error al cargar detalle')
    });
  }

  cerrarModal(): void { this.mostrarDetalle = false; this.ventaDetalle = null; }

  // ── Nueva venta presencial ───────────────────────────────────
  abrirNuevaVenta(): void {
    this.modalNuevaVenta  = true;
    this.carrito          = [];
    this.busquedaProducto = '';
    this.metodoPagoNueva  = '';
    this.errorNueva       = '';
    this.exitoNueva       = false;
    if (!this.productosAll.length) {
      this.productoService.getAll().subscribe({
        next: (res) => {
          this.productosAll  = res.data.filter(p => p.estado === 'activo' && p.stock > 0);
          this.productosBusq = this.productosAll;
        }
      });
    } else {
      this.productosBusq = this.productosAll;
    }
  }

  cerrarNuevaVenta(): void { this.modalNuevaVenta = false; }

  filtrarProductos(): void {
    const q = this.busquedaProducto.toLowerCase().trim();
    this.productosBusq = q
      ? this.productosAll.filter(p =>
          p.nombre_producto.toLowerCase().includes(q) ||
          p.codigo_producto.toLowerCase().includes(q)
        )
      : this.productosAll;
  }

  agregarProducto(p: IProducto): void {
    const item = this.carrito.find(i => i.producto.id_producto === p.id_producto);
    if (item) {
      if (item.cantidad < p.stock) item.cantidad++;
    } else {
      this.carrito.push({ producto: p, cantidad: 1 });
    }
  }

  quitarProducto(id: number): void {
    this.carrito = this.carrito.filter(i => i.producto.id_producto !== id);
  }

  cambiarCantidad(id: number, delta: number): void {
    const item = this.carrito.find(i => i.producto.id_producto === id);
    if (!item) return;
    const nueva = item.cantidad + delta;
    if (nueva <= 0) { this.quitarProducto(id); return; }
    if (nueva > item.producto.stock) return;
    item.cantidad = nueva;
  }

  get totalCarrito(): number {
    return this.carrito.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  }

  registrarVenta(): void {
    if (!this.carrito.length)       { this.errorNueva = 'Agrega al menos un producto'; return; }
    if (!this.metodoPagoNueva)      { this.errorNueva = 'Selecciona el método de pago'; return; }
    this.guardando  = true;
    this.errorNueva = '';
    const body = {
      metodo_pago: this.metodoPagoNueva,
      detalles: this.carrito.map(i => ({
        id_producto:    i.producto.id_producto,
        cantidad:       i.cantidad,
        precio_unitario: i.producto.precio
      }))
    };
    this.ventaService.create(body).subscribe({
      next: () => {
        this.guardando  = false;
        this.exitoNueva = true;
        this.productosAll = [];
        setTimeout(() => { this.cerrarNuevaVenta(); this.cargar(); }, 1200);
      },
      error: (err) => {
        this.guardando  = false;
        this.errorNueva = err?.error?.mensaje || 'Error al registrar la venta';
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  esServicio(v: IVenta): boolean { return !!v.id_reserva; }
  tipoBadge(v: IVenta): string   { return v.id_reserva ? 'badge-servicio' : 'badge-producto'; }

  nombreVenta(v: IVenta): string {
    return v.nombre_cajero || (v.id_reserva ? 'Sin cajero' : 'Compra en línea');
  }

  metodoPagoLabel(m: string, esProductoSinReserva = false): string {
    if (esProductoSinReserva && m === 'otro') return 'Pago en línea';
    const map: any = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', nequi: 'Nequi', otro: 'Otro' };
    return map[m] || m;
  }

  metodoBadgeClass(m: string, esProductoSinReserva = false): string {
    if (esProductoSinReserva && m === 'otro') return 'badge-online';
    const map: any = { efectivo: 'badge-success', tarjeta: 'badge-info', transferencia: 'badge-warning', nequi: 'badge-nequi', otro: 'badge-default' };
    return map[m] || 'badge-default';
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);
  }
}
