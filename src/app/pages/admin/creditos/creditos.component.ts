import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CreditoService, ICredito, IRegistrarAbono, ICrearCreditoAdmin } from '../../../core/services/credito.service';
import { ProductoService, IProducto } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-creditos',
  templateUrl: './creditos.component.html',
  styleUrls: ['./creditos.component.scss']
})
export class CreditosComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ─── Pestañas ─────────────────────────────────────────────
  tabActiva: 'pendientes' | 'activos' | 'pagados' | 'rechazados' = 'activos';

  // ─── Datos ────────────────────────────────────────────────
  todosLosCreditos: ICredito[] = [];
  cargando  = false;
  busqueda  = '';

  // ─── Modal crear ──────────────────────────────────────────
  modalCrear   = false;
  guardando    = false;
  errorModal   = '';

  form: ICrearCreditoAdmin = this.formVacio();

  productos:             IProducto[] = [];
  productosSeleccionados: { producto: IProducto; cantidad: number }[] = [];
  busquedaCodigo         = '';
  productoEncontrado:    IProducto | null = null;
  errorBusquedaCodigo    = '';

  // ─── Modal detalle ────────────────────────────────────────
  modalDetalle    = false;
  creditoDetalle: ICredito | null = null;

  // ─── Modal aprobar/rechazar ───────────────────────────────
  modalAprobar     = false;
  creditoPendiente: ICredito | null = null;
  procesando       = false;

  // ─── Modal abonar ─────────────────────────────────────────
  modalAbonar    = false;
  creditoAbonar: ICredito | null = null;
  abonoForm: IRegistrarAbono = this.abonoVacio();
  guardandoAbono = false;

  metodosAbono: Array<'efectivo' | 'transferencia'> = ['efectivo', 'transferencia'];

  plazos = [
    { id: '1_semana',    label: '1 Semana'    },
    { id: '1_quincena',  label: '1 Quincena'  },
    { id: '2_quincenas', label: '2 Quincenas' },
    { id: '1_mes',       label: '1 Mes'       }
  ];

  constructor(
    private creditoService:  CreditoService,
    private productoService: ProductoService,
    private toastService:    ToastService,
    private socketService:   SocketService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarProductos();

    this.socketService.connect();
    this.socketService.onCreditoEvento()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargar());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Carga ────────────────────────────────────────────────
  cargar(): void {
    this.cargando = true;
    this.creditoService.getAll().subscribe({
      next: (res) => { this.todosLosCreditos = res.data; this.cargando = false; },
      error: () => { this.toastService.error('Error al cargar créditos'); this.cargando = false; }
    });
  }

  cargarProductos(): void {
    this.productoService.getAll().subscribe({
      next: (res) => this.productos = res.data.filter(p => p.estado === 'activo' && p.stock > 0),
      error: () => {}
    });
  }

  // ─── Getters por pestaña ──────────────────────────────────
  get creditosPendientes(): ICredito[] {
    return this.todosLosCreditos.filter(c =>
      c.estado === 'pendiente' &&
      (this.busqueda ? this.matchBusqueda(c) : true)
    );
  }

  get creditosActivos(): ICredito[] {
    return this.todosLosCreditos.filter(c =>
      (c.estado === 'activo' || c.estado === 'vencido') &&
      (this.busqueda ? this.matchBusqueda(c) : true)
    );
  }

  get creditosPagados(): ICredito[] {
    return this.todosLosCreditos.filter(c =>
      c.estado === 'pagado' &&
      (this.busqueda ? this.matchBusqueda(c) : true)
    );
  }

  get creditosRechazados(): ICredito[] {
    return this.todosLosCreditos.filter(c =>
      c.estado === 'rechazado' &&
      (this.busqueda ? this.matchBusqueda(c) : true)
    );
  }

  get contadorRechazados(): number { return this.todosLosCreditos.filter(c => c.estado === 'rechazado').length; }

  matchBusqueda(c: ICredito): boolean {
    const b = this.busqueda.toLowerCase();
    return c.nombre_cliente.toLowerCase().includes(b) ||
           c.telefono_cliente.includes(b);
  }

  get contadorPendientes(): number { return this.todosLosCreditos.filter(c => c.estado === 'pendiente').length; }
  get totalRecaudado(): number {
    return this.todosLosCreditos
      .filter(c => c.estado !== 'pendiente' && c.estado !== 'rechazado')
      .reduce((sum, c) => sum + (Number(c.monto_total) - Number(c.saldo_pendiente)), 0);
  }
  get totalPorCobrar(): number {
    return this.todosLosCreditos
      .filter(c => c.estado === 'activo' || c.estado === 'vencido')
      .reduce((sum, c) => sum + Number(c.saldo_pendiente), 0);
  }
  get creditosVencidos(): number { return this.todosLosCreditos.filter(c => c.estado === 'vencido').length; }

  // ─── Modal Crear ──────────────────────────────────────────
  abrirModalCrear(): void {
    this.form = this.formVacio();
    this.productosSeleccionados = [];
    this.busquedaCodigo = '';
    this.productoEncontrado = null;
    this.errorBusquedaCodigo = '';
    this.errorModal = '';
    this.modalCrear = true;
  }

  cerrarModalCrear(): void { this.modalCrear = false; this.errorModal = ''; }

  buscarPorCodigo(): void {
    this.errorBusquedaCodigo = '';
    this.productoEncontrado  = null;
    const codigo = this.busquedaCodigo.trim().toLowerCase();
    if (!codigo) return;
    const encontrado = this.productos.find(p => p.codigo_producto.toLowerCase() === codigo);
    if (encontrado) {
      this.productoEncontrado = encontrado;
    } else {
      this.errorBusquedaCodigo = `No se encontró ningún producto con el código "${this.busquedaCodigo}"`;
    }
  }

  confirmarProducto(): void {
    if (!this.productoEncontrado) return;
    this.agregarProductoCredito(this.productoEncontrado);
    this.busquedaCodigo      = '';
    this.productoEncontrado  = null;
    this.errorBusquedaCodigo = '';
  }

  agregarProductoCredito(producto: IProducto): void {
    const existe = this.productosSeleccionados.find(
      p => p.producto.id_producto === producto.id_producto
    );
    if (existe) {
      if (existe.cantidad < producto.stock) existe.cantidad++;
    } else {
      this.productosSeleccionados.push({ producto, cantidad: 1 });
    }
    this.recalcularTotal();
  }

  get productosFiltradosCredito(): IProducto[] {
    const q = this.busquedaCodigo.toLowerCase().trim();
    const lista = q
      ? this.productos.filter(p =>
          p.nombre_producto.toLowerCase().includes(q) ||
          p.codigo_producto.toLowerCase().includes(q)
        )
      : this.productos;

    return lista.slice(0, 8);
  }

  quitarProducto(id: number): void {
    this.productosSeleccionados = this.productosSeleccionados.filter(
      p => p.producto.id_producto !== id
    );
    this.recalcularTotal();
  }

  cambiarCantidad(id: number, cantidad: number): void {
    const item = this.productosSeleccionados.find(p => p.producto.id_producto === id);
    if (!item) return;
    if (cantidad <= 0) { this.quitarProducto(id); return; }
    item.cantidad = Math.min(cantidad, item.producto.stock);
    this.recalcularTotal();
  }

  recalcularTotal(): void {
    this.form.productos = this.productosSeleccionados.map(p => ({
      id_producto:     p.producto.id_producto,
      cantidad:        p.cantidad,
      precio_unitario: Number(p.producto.precio),
      subtotal:        Number(p.producto.precio) * p.cantidad
    }));
  }

  get totalCredito(): number {
    return this.productosSeleccionados.reduce(
      (sum, p) => sum + (Number(p.producto.precio) * p.cantidad), 0
    );
  }

  guardar(): void {
    if (!this.form.nombre_cliente.trim())  { this.errorModal = 'Nombre del cliente requerido'; return; }
    if (!this.form.telefono_cliente.trim()) { this.errorModal = 'Teléfono requerido'; return; }
    if (!this.form.plazo)                   { this.errorModal = 'Selecciona un plazo'; return; }
    if (!this.productosSeleccionados.length){ this.errorModal = 'Agrega al menos un producto'; return; }

    this.recalcularTotal();
    this.guardando = true;

    this.creditoService.crearAdmin(this.form).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModalCrear();
        this.cargar();
        this.toastService.success('Crédito creado y activo');
      },
      error: (err: any) => {
        this.errorModal = err.error?.mensaje || 'Error al guardar';
        this.guardando  = false;
      }
    });
  }

  // ─── Detalle ──────────────────────────────────────────────
  verDetalle(id: number): void {
    this.creditoDetalle = null;
    this.modalDetalle   = true;
    this.creditoService.getById(id).subscribe({
      next: (res) => this.creditoDetalle = res.data,
      error: () => this.toastService.error('Error al cargar detalle')
    });
  }

  // ─── Aprobar/Rechazar ─────────────────────────────────────
  abrirAprobar(credito: ICredito): void {
    this.creditoPendiente = credito;
    this.modalAprobar     = true;
  }

  aprobar(): void {
    if (!this.creditoPendiente) return;
    this.procesando = true;
    this.creditoService.aprobar(this.creditoPendiente.id_credito).subscribe({
      next: () => {
        this.procesando   = false;
        this.modalAprobar = false;
        this.cargar();
        this.toastService.success('Crédito aprobado — stock descontado');
      },
      error: (err: any) => {
        this.toastService.error('Error al aprobar', err?.error?.mensaje || 'Error inesperado');
        this.procesando = false;
      }
    });
  }

  rechazar(): void {
    if (!this.creditoPendiente) return;
    this.procesando = true;
    this.creditoService.rechazar(this.creditoPendiente.id_credito).subscribe({
      next: () => {
        this.procesando   = false;
        this.modalAprobar = false;
        this.cargar();
        this.toastService.success('Solicitud rechazada');
      },
      error: (err: any) => {
        this.toastService.error('Error al rechazar', err?.error?.mensaje || 'No se pudo rechazar la solicitud.');
        this.procesando = false;
      }
    });
  }

  // ─── Abonar ───────────────────────────────────────────────
  abrirAbonar(credito: ICredito): void {
    this.creditoAbonar          = credito;
    this.abonoForm              = this.abonoVacio();
    this.abonoForm.id_credito   = credito.id_credito;
    this.modalAbonar            = true;
  }

  setMetodoPago(m: 'efectivo' | 'transferencia'): void {
    this.abonoForm.metodo_pago = m;
  }

  autoResizeObservacion(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  registrarAbono(): void {
    if (!this.abonoForm.monto || this.abonoForm.monto <= 0) {
      this.toastService.warning('Ingresa un monto válido'); return;
    }
    this.guardandoAbono = true;
    this.creditoService.abonar(this.abonoForm).subscribe({
      next: () => {
        this.guardandoAbono = false;
        this.modalAbonar    = false;
        this.cargar();
        this.toastService.success('Abono registrado correctamente');
      },
      error: (err: any) => {
        this.toastService.error('Error al registrar abono', err?.error?.mensaje || 'Error inesperado');
        this.guardandoAbono = false;
      }
    });
  }

  // ─── Utils ────────────────────────────────────────────────
  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v || 0);
  }

  plazoLabel(p: string): string {
    const map: any = {
      '1_semana': '1 Semana', '1_quincena': '1 Quincena',
      '2_quincenas': '2 Quincenas', '1_mes': '1 Mes'
    };
    return map[p] || p;
  }

  estadoClass(e: string): string {
    const map: any = {
      pendiente: 'badge-warning', activo: 'badge-info',
      pagado: 'badge-success',    vencido: 'badge-danger',
      rechazado: 'badge-rechazado'
    };
    return map[e] || 'badge-default';
  }

  diasRestantes(fecha: string): number {
    const hoy   = new Date();
    const vence = new Date(fecha);
    return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  private formVacio(): ICrearCreditoAdmin {
    return {
      nombre_cliente: '', telefono_cliente: '',
      plazo: '1_quincena', observaciones: '', productos: []
    };
  }

  private abonoVacio(): IRegistrarAbono {
    return { id_credito: 0, monto: 0, metodo_pago: 'efectivo', observacion: '' };
  }
}
