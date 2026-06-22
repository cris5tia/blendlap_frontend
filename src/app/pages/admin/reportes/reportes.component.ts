import { Component, OnInit } from '@angular/core';
import {
  ReporteService, IFiltroReporte, IReporteCompleto, IKPIs,
  IVentaDia, IMetodoPago, ITopServicio, ITopProducto,
  IBarberoReporte, IGastoCategoria, ITopCliente
} from '../../../core/services/reporte.service';
import { BarberoService, IBarbero } from '../../../core/services/barbero.service';
import { ToastService } from '../../../core/services/toast.service';

export type ReporteTab = 'dashboard' | 'ventas' | 'reservas' | 'barberos' | 'creditos' | 'clientes' | 'gastos';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {

  tab: ReporteTab = 'dashboard';
  cargando       = false;
  descargando    = false;
  datos: IReporteCompleto | null = null;
  barberos: IBarbero[] = [];

  filtro: IFiltroReporte = ReporteService.presetMes();
  presetActivo = 'mes';

  // ── Chart options ──────────────────────────────────────────────────────────
  lineIngresosOpts:  any = {};
  lineGastosOpts:    any = {};
  barHoraOpts:       any = {};
  donutMetodosOpts:  any = null;
  barServiciosOpts:  any = null;
  barProductosOpts:  any = null;
  barBarberosOpts:   any = null;
  donutReservasOpts: any = null;
  donutCreditosOpts: any = null;
  donutGastosOpts:   any = null;
  barClientesOpts:   any = null;

  constructor(
    private reporteService: ReporteService,
    private barberoService: BarberoService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.barberoService.getAllAdmin().subscribe({ next: r => this.barberos = r.data, error: () => {} });
    this.cargar();
  }

  // ── Filtros ────────────────────────────────────────────────────────────────

  setPreset(preset: string): void {
    this.presetActivo = preset;
    switch (preset) {
      case 'hoy':     this.filtro = ReporteService.presetHoy();          break;
      case 'semana':  this.filtro = ReporteService.presetSemana();        break;
      case 'mes':     this.filtro = ReporteService.presetMes();           break;
      case 'mes_ant': this.filtro = ReporteService.presetMesAnterior();   break;
      case 'ano':     this.filtro = ReporteService.presetAno();           break;
    }
    this.cargar();
  }

  onFechaChange(): void {
    this.presetActivo = 'custom';
    if (this.filtro.fechaInicio && this.filtro.fechaFin &&
        this.filtro.fechaInicio <= this.filtro.fechaFin) {
      this.cargar();
    }
  }

  // ── Carga ──────────────────────────────────────────────────────────────────

  cargar(): void {
    this.cargando = true;
    this.reporteService.getCompleto(this.filtro).subscribe({
      next: r => { this.datos = r.data; this.buildCharts(); this.cargando = false; },
      error: () => { this.toast.error('Error al cargar reportes'); this.cargando = false; }
    });
  }

  // ── Chart builders ─────────────────────────────────────────────────────────

  private buildCharts(): void {
    if (!this.datos) return;
    const d = this.datos;
    const PALETTE = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];

    // Line: ingresos por día
    const diasLabel = d.ventas_por_dia.map((v: IVentaDia) => this.fmtDia(v.dia));
    const diasData  = d.ventas_por_dia.map((v: IVentaDia) => Number(v.total));
    this.lineIngresosOpts = this.buildAreaChart('Ingresos', diasLabel, diasData, '#3b82f6');

    // Line: gastos por día
    const diasGLabel = d.gastos_por_dia.map((g: any) => this.fmtDia(g.dia));
    const diasGData  = d.gastos_por_dia.map((g: any) => Number(g.total));
    this.lineGastosOpts = this.buildAreaChart('Gastos', diasGLabel, diasGData, '#ef4444');

    // Bar: ventas por hora
    const horas    = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const horasMap: Record<number, number> = {};
    d.ventas_por_hora.forEach((h: any) => { horasMap[h.hora] = Number(h.total); });
    const horasData = Array.from({ length: 24 }, (_, i) => horasMap[i] || 0);
    this.barHoraOpts = {
      series:      [{ name: 'Ingresos', data: horasData }],
      chart:       { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis:       { categories: horas, labels: { style: { fontSize: '9px' } } },
      yaxis:       { labels: { formatter: (v: number) => this.fmtK(v) } },
      colors:      ['#3b82f6'],
      plotOptions: { bar: { borderRadius: 3, columnWidth: '65%' } },
      dataLabels:  { enabled: false },
      grid:        { borderColor: '#f1f3f5' },
      tooltip:     { y: { formatter: (v: number) => this.fmtCOP(v) } }
    };

    // Donut: métodos de pago
    const metodos = d.metodos_pago as IMetodoPago[];
    this.donutMetodosOpts = metodos.length ? {
      series:      metodos.map(m => Number(m.total)),
      chart:       { type: 'donut', height: 280, fontFamily: 'inherit' },
      labels:      metodos.map(m => this.metodoPagoLabel(m.metodo_pago)),
      colors:      PALETTE,
      dataLabels:  { enabled: false },
      legend:      { position: 'bottom', fontSize: '12px' },
      tooltip:     { y: { formatter: (v: number) => this.fmtCOP(v) } },
      plotOptions: { pie: { donut: { size: '65%' } } }
    } : null;

    // Bar horizontal: top servicios
    const topS = (d.top_servicios as ITopServicio[]).slice(0, 8);
    this.barServiciosOpts = topS.length ? {
      series:      [{ name: 'Veces', data: topS.map(s => s.veces_solicitado) }],
      chart:       { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis:       { categories: topS.map(s => s.nombre_servicio), labels: { style: { fontSize: '11px' } } },
      yaxis:       { labels: { formatter: (v: number) => String(v) } },
      colors:      ['#10b981'],
      plotOptions: { bar: { borderRadius: 5, horizontal: true } },
      dataLabels:  { enabled: false },
      grid:        { borderColor: '#f1f3f5' },
      tooltip:     { y: { formatter: (v: number) => `${v} veces` } }
    } : null;

    // Bar horizontal: top productos
    const topP = (d.top_productos as ITopProducto[]).slice(0, 8);
    this.barProductosOpts = topP.length ? {
      series:      [{ name: 'Unidades', data: topP.map(p => Number(p.cantidad_vendida)) }],
      chart:       { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis:       { categories: topP.map(p => p.nombre_producto), labels: { style: { fontSize: '11px' } } },
      yaxis:       { labels: { formatter: (v: number) => String(v) } },
      colors:      ['#f59e0b'],
      plotOptions: { bar: { borderRadius: 5, horizontal: true } },
      dataLabels:  { enabled: false },
      grid:        { borderColor: '#f1f3f5' },
      tooltip:     { y: { formatter: (v: number) => `${v} unidades` } }
    } : null;

    // Bar: barberos (ingresos + comisión)
    const barbs = d.barberos as IBarberoReporte[];
    this.barBarberosOpts = barbs.length ? {
      series: [
        { name: 'Ingresos generados', data: barbs.map(b => Number(b.total_servicios)) },
        { name: 'Comisión barbero',   data: barbs.map(b => Number(b.comision_barbero)) },
      ],
      chart:       { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis:       { categories: barbs.map(b => b.barbero), labels: { style: { fontSize: '11px' } } },
      yaxis:       { labels: { formatter: (v: number) => this.fmtK(v) } },
      colors:      ['#3b82f6', '#10b981'],
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
      dataLabels:  { enabled: false },
      legend:      { position: 'top' },
      grid:        { borderColor: '#f1f3f5' },
      tooltip:     { y: { formatter: (v: number) => this.fmtCOP(v) } }
    } : null;

    // Donut: reservas por estado
    const resEstados: Record<string, number> = {};
    d.reservas_por_dia.forEach((r: any) => {
      resEstados[r.estado] = (resEstados[r.estado] || 0) + Number(r.cantidad);
    });
    const resLabels = Object.keys(resEstados);
    this.donutReservasOpts = resLabels.length ? {
      series:      Object.values(resEstados),
      chart:       { type: 'donut', height: 260, fontFamily: 'inherit' },
      labels:      resLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      colors:      ['#3b82f6', '#10b981', '#ef4444'],
      dataLabels:  { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
      legend:      { position: 'bottom', fontSize: '12px' },
      plotOptions: { pie: { donut: { size: '60%' } } }
    } : null;

    // Donut: créditos por estado
    const credEst = (d.creditos?.estadisticas || []) as any[];
    this.donutCreditosOpts = credEst.length ? {
      series:      credEst.map(c => Number(c.cantidad)),
      chart:       { type: 'donut', height: 260, fontFamily: 'inherit' },
      labels:      credEst.map(c => c.estado.charAt(0).toUpperCase() + c.estado.slice(1)),
      colors:      ['#f59e0b','#3b82f6','#10b981','#ef4444','#6b7280'],
      dataLabels:  { enabled: false },
      legend:      { position: 'bottom', fontSize: '12px' },
      tooltip:     { y: { formatter: (v: number) => `${v} créditos` } },
      plotOptions: { pie: { donut: { size: '60%' } } }
    } : null;

    // Donut: gastos por categoría
    const gastosCat = d.gastos_por_categoria as IGastoCategoria[];
    this.donutGastosOpts = gastosCat.length ? {
      series:      gastosCat.map(g => Number(g.total)),
      chart:       { type: 'donut', height: 280, fontFamily: 'inherit' },
      labels:      gastosCat.map(g => g.categoria),
      colors:      ['#ef4444','#f97316','#f59e0b','#8b5cf6','#ec4899','#06b6d4'],
      dataLabels:  { enabled: false },
      legend:      { position: 'bottom', fontSize: '12px' },
      tooltip:     { y: { formatter: (v: number) => this.fmtCOP(v) } },
      plotOptions: { pie: { donut: { size: '65%' } } }
    } : null;

    // Bar horizontal: top clientes
    const topC = (d.top_clientes as ITopCliente[]).slice(0, 8);
    this.barClientesOpts = topC.length ? {
      series:      [{ name: 'Total gastado', data: topC.map(c => Number(c.total_gastado)) }],
      chart:       { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis:       { categories: topC.map(c => c.cliente), labels: { style: { fontSize: '11px' } } },
      yaxis:       { labels: { formatter: (v: number) => this.fmtK(v) } },
      colors:      ['#8b5cf6'],
      plotOptions: { bar: { borderRadius: 5, horizontal: true } },
      dataLabels:  { enabled: false },
      grid:        { borderColor: '#f1f3f5' },
      tooltip:     { y: { formatter: (v: number) => this.fmtCOP(v) } }
    } : null;
  }

  private buildAreaChart(name: string, categories: string[], data: number[], color: string): any {
    return {
      series:     [{ name, data }],
      chart:      { type: 'area', height: 260, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis:      { categories, labels: { style: { fontSize: '9px' }, rotate: -30 } },
      yaxis:      { labels: { formatter: (v: number) => this.fmtK(v) } },
      colors:     [color],
      stroke:     { curve: 'smooth', width: 2 },
      fill:       { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.04 } },
      dataLabels: { enabled: false },
      grid:       { borderColor: '#f1f3f5' },
      tooltip:    { y: { formatter: (v: number) => this.fmtCOP(v) } }
    };
  }

  // ── Exportaciones ──────────────────────────────────────────────────────────

  exportarPDF(): void {
    this.descargando = true;
    this.reporteService.descargarPDF(this.filtro).subscribe({
      next:  blob  => { this.triggerDownload(blob, `reporte_${this.filtro.fechaInicio}_${this.filtro.fechaFin}.pdf`); this.descargando = false; },
      error: ()    => { this.toast.error('Error al generar PDF'); this.descargando = false; }
    });
  }

  exportarExcel(): void {
    this.descargando = true;
    this.reporteService.descargarExcel(this.filtro).subscribe({
      next:  blob  => { this.triggerDownload(blob, `reporte_${this.filtro.fechaInicio}_${this.filtro.fechaFin}.xlsx`); this.descargando = false; },
      error: ()    => { this.toast.error('Error al generar Excel'); this.descargando = false; }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  compartirWhatsApp(): void {
    if (!this.datos) return;
    const k = this.datos.kpis as IKPIs;
    const texto = [
      `*Reporte Barbería*`,
      `📅 ${this.filtro.fechaInicio} al ${this.filtro.fechaFin}`,
      ``,
      `💰 Ingresos: ${this.fmtCOP(k.ingresos_total)}`,
      `💸 Gastos: ${this.fmtCOP(k.total_gastos)}`,
      `📊 Ganancia neta: ${this.fmtCOP(k.ganancia_neta)}`,
      `✂️ Reservas: ${k.reservas_total} (${k.reservas_completadas} completadas)`,
      `🧔 Comisiones barberos: ${this.fmtCOP(k.total_comisiones_barbero)}`,
      `👥 Clientes nuevos: ${k.clientes_nuevos}`,
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  }

  // ── Getters de datos ───────────────────────────────────────────────────────

  get kpis(): IKPIs | null { return this.datos?.kpis ?? null; }

  get creditosStats(): Record<string, any> {
    const map: Record<string, any> = {};
    (this.datos?.creditos?.estadisticas || []).forEach((c: any) => { map[c.estado] = c; });
    return map;
  }

  get gastoTotal(): number {
    return (this.datos?.gastos_por_categoria || []).reduce((s: number, g: any) => s + Number(g.total), 0);
  }

  get margenNeto(): number {
    const ing = this.kpis?.ingresos_total || 0;
    const net = this.kpis?.ganancia_neta  || 0;
    return ing > 0 ? Math.round((net / ing) * 100) : 0;
  }

  get tasaCompletacion(): number {
    const total = this.kpis?.reservas_total       || 0;
    const comp  = this.kpis?.reservas_completadas || 0;
    return total > 0 ? Math.round((comp / total) * 100) : 0;
  }

  // ── Formato ───────────────────────────────────────────────────────────────

  fmtCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v || 0);
  }

  fmtK(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
    return `$${Math.round(v)}`;
  }

  fmtDia(dia: string): string {
    if (!dia) return '';
    const d = new Date(dia.split('T')[0] + 'T12:00:00');
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${m[d.getMonth()]}`;
  }

  metodoPagoLabel(m: string): string {
    const map: Record<string, string> = {
      efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia',
      nequi: 'Nequi', otro: 'Otro / Online', credito: 'Crédito'
    };
    return map[m] || m;
  }

  metodoPagoBadge(m: string): string {
    const map: Record<string, string> = {
      efectivo: 'badge-success', tarjeta: 'badge-info',
      transferencia: 'badge-warning', nequi: 'badge-nequi',
      otro: 'badge-default', credito: 'badge-danger'
    };
    return map[m] || 'badge-default';
  }

  estadoCreditoClass(e: string): string {
    const map: Record<string, string> = {
      pendiente: 'badge-warning', activo: 'badge-info', pagado: 'badge-success',
      vencido: 'badge-danger', rechazado: 'badge-rechazado'
    };
    return map[e] || 'badge-default';
  }
}
