import { Component, OnInit, OnDestroy } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VentaService, IVenta, ICierreCaja, IAbonoDia } from '../../../core/services/venta.service';
import { ReservaService, IReserva } from '../../../core/services/reserva.service';
import { CreditoService, ICredito } from '../../../core/services/credito.service';
import { BarberoService, IBarbero } from '../../../core/services/barbero.service';
import { ToastService } from '../../../core/services/toast.service';
import { SocketService } from '../../../core/services/socket.service';

interface BarberoResumen {
  nombre:        string;
  foto?:         string;
  servicios:     number;
  totalBruto:    number;
  comisionPct:   number;
  pagoComision:  number;
  ingresoLocal:  number;
  reservas:      IReserva[];
}

@Component({
  selector: 'app-cierre-caja',
  templateUrl: './cierre-caja.component.html',
  styleUrls: ['./cierre-caja.component.scss']
})
export class CierreCajaComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  fecha = new Date().toISOString().split('T')[0];

  resumen:  ICierreCaja | null = null;
  ventas:   IVenta[]    = [];
  reservas: IReserva[]  = [];
  creditos: ICredito[]  = [];
  barberos: IBarbero[]  = [];

  cargando = false;

  constructor(
    private ventaService:   VentaService,
    private reservaService: ReservaService,
    private creditoService: CreditoService,
    private barberoService: BarberoService,
    private toastService:   ToastService,
    private socketService:  SocketService
  ) {}

  ngOnInit(): void {
    this.cargarTodo();
    this.socketService.connect();
    this.socketService.onVentaNueva()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarTodo());
    this.socketService.onReservaActualizada()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarTodo());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarTodo(): void {
    this.cargando = true;

    forkJoin({
      resumen:  this.ventaService.cierreCaja(this.fecha),
      ventas:   this.ventaService.getAll(),
      reservas: this.reservaService.getAllAdmin({ fecha: this.fecha }),
      creditos: this.creditoService.getAll(),
      barberos: this.barberoService.getAllAdmin()
    }).subscribe({
      next: ({ resumen, ventas, reservas, creditos, barberos }) => {
        this.resumen  = resumen.data;
        this.ventas   = ventas.data.filter(v => v.fecha?.startsWith(this.fecha));
        this.reservas = reservas.data;
        this.creditos = creditos.data.filter(c =>
          c.fecha_creacion?.startsWith(this.fecha) && c.estado === 'activo'
        );
        this.barberos = barberos.data;
        this.cargando = false;
      },
      error: () => { this.toastService.error('Error al cargar los datos del cierre'); this.cargando = false; }
    });
  }

  // ── Totales brutos ───────────────────────────────────────────
  get totalReservas(): number {
    return this.reservas.reduce((s, r) => s + Number(r.precio_total || 0), 0);
  }

  get totalVentas(): number {
    return this.ventas.reduce((s, v) => s + Number(v.total || 0), 0);
  }

  get totalCreditos(): number {
    return this.creditos.reduce((s, c) => s + Number(c.monto_total || 0), 0);
  }

  get totalDia(): number {
    return this.totalReservas + this.totalVentas;
  }

  // ── Abonos del día ───────────────────────────────────────────
  get abonos(): IAbonoDia[] {
    return (this.resumen?.abonos_del_dia ?? []) as IAbonoDia[];
  }

  get totalAbonadoHoy(): number {
    return this.resumen?.total_abonado_hoy ?? 0;
  }

  // ── Comisiones ───────────────────────────────────────────────
  get totalComisiones(): number {
    return this.porBarbero.reduce((s, b) => s + b.pagoComision, 0);
  }

  get ingresoNetoLocal(): number {
    return this.totalReservas - this.totalComisiones;
  }

  get hayComisiones(): boolean {
    return this.porBarbero.some(b => b.comisionPct > 0);
  }

  // ── KPIs activos ─────────────────────────────────────────────
  get activosCount(): number {
    return (this.reservas.length ? 1 : 0) + (this.ventas.length ? 1 : 0) + (this.creditos.length ? 1 : 0) + 1;
  }

  // ── Agrupado por barbero con comisiones ──────────────────────
  get porBarbero(): BarberoResumen[] {
    const map = new Map<string, BarberoResumen>();

    for (const r of this.reservas) {
      const nombre = r.nombre_barbero?.trim() || 'Sin asignar';

      // Buscar comisión del barbero por nombre
      const bData = this.barberos.find(b =>
        `${b.nombre} ${b.apellido}`.trim().toLowerCase() === nombre.toLowerCase() ||
        b.nombre.trim().toLowerCase() === nombre.toLowerCase()
      );
      const comisionPct = bData?.comision ?? 0;

      if (!map.has(nombre)) {
        map.set(nombre, { nombre, foto: bData?.foto, servicios: 0, totalBruto: 0, comisionPct, pagoComision: 0, ingresoLocal: 0, reservas: [] });
      }
      const entry = map.get(nombre)!;
      entry.servicios++;
      entry.totalBruto += Number(r.precio_total || 0);
      entry.reservas.push(r);
    }

    // Calcular montos de comisión
    for (const entry of map.values()) {
      entry.pagoComision = Math.round(entry.totalBruto * entry.comisionPct / 100);
      entry.ingresoLocal = entry.totalBruto - entry.pagoComision;
    }

    return Array.from(map.values()).sort((a, b) => b.totalBruto - a.totalBruto);
  }

  // ── Métodos de pago ──────────────────────────────────────────
  get metodos() {
    if (!this.resumen) return [];
    const total = this.resumen.total_ventas || 1;
    const pct = (v: number) => Math.round((v / total) * 100);
    return [
      { nombre: 'Efectivo',      monto: this.resumen.total_efectivo,     pct: pct(this.resumen.total_efectivo),     icon: 'fas fa-money-bill-wave', cls: 'efectivo' },
      { nombre: 'Tarjeta',       monto: this.resumen.total_tarjeta,       pct: pct(this.resumen.total_tarjeta),       icon: 'fas fa-credit-card',     cls: 'tarjeta' },
      { nombre: 'Nequi',         monto: this.resumen.total_nequi,         pct: pct(this.resumen.total_nequi),         icon: 'fas fa-mobile-alt',      cls: 'nequi' },
      { nombre: 'Transferencia', monto: this.resumen.total_transferencia, pct: pct(this.resumen.total_transferencia), icon: 'fas fa-exchange-alt',    cls: 'transferencia' },
      { nombre: 'Pasarela de pago', monto: this.resumen.total_otro,       pct: pct(this.resumen.total_otro),          icon: 'fas fa-credit-card',     cls: 'otro' },
    ].filter(m => m.monto > 0);
  }

  // ── Helpers ──────────────────────────────────────────────────
  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);
  }

  formatFechaLarga(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  metodoPagoLabel(m: string): string {
    const map: any = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', nequi: 'Nequi', otro: 'Pasarela de pago' };
    return map[m] || m;
  }

  metodoBadgeClass(m: string): string {
    const map: any = { efectivo: 'badge-success', tarjeta: 'badge-info', transferencia: 'badge-warning', nequi: 'badge-nequi', otro: 'badge-default' };
    return map[m] || 'badge-default';
  }

  estadoReservaBadge(e: string): string {
    const map: any = { confirmada: 'badge-success', pendiente: 'badge-warning', cancelada: 'badge-danger', completada: 'badge-info' };
    return map[e] || 'badge-default';
  }

  exportarPDF(): void { window.print(); }
}
