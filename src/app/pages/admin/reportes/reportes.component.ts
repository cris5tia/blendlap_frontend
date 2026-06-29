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
  lineIngresosOpts:    any = {};
  lineGastosOpts:      any = {};
  lineComparativaOpts: any = null;
  barHoraOpts:         any = {};
  donutMetodosOpts:    any = null;
  barServiciosOpts:    any = null;
  barProductosOpts:    any = null;
  barBarberosOpts:     any = null;
  donutReservasOpts:   any = null;
  donutCreditosOpts:   any = null;
  donutGastosOpts:     any = null;
  barClientesOpts:     any = null;

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

    // ── Datos base: combinar días de ingresos y gastos ──────────────────────
    const allDias = [...new Set([
      ...d.ventas_por_dia.map((v: IVentaDia) => v.dia),
      ...d.gastos_por_dia.map((g: any) => g.dia)
    ])].sort();
    const ingMap: Record<string, number> = {};
    const gasMap: Record<string, number> = {};
    d.ventas_por_dia.forEach((v: IVentaDia) => { ingMap[v.dia] = Number(v.total); });
    d.gastos_por_dia.forEach((g: any)       => { gasMap[g.dia] = Number(g.total); });
    const diasLabel = allDias.map(dia => this.fmtDia(dia));
    const ingData   = allDias.map(dia => ingMap[dia] || 0);
    const gasData   = allDias.map(dia => gasMap[dia] || 0);

    // Área simple ingresos / gastos
    this.lineIngresosOpts = this.buildAreaChart('Ingresos', diasLabel, ingData, '#3b82f6');
    this.lineGastosOpts   = this.buildAreaChart('Gastos',   diasLabel, gasData, '#ef4444');

    // Área comparativa doble (ingresos vs gastos)
    this.lineComparativaOpts = allDias.length ? {
      series: [
        { name: 'Ingresos', data: ingData },
        { name: 'Gastos',   data: gasData }
      ],
      chart:      { type: 'area', height: 310, toolbar: { show: false }, fontFamily: 'inherit', animations: { speed: 500 } },
      xaxis:      {
        categories: diasLabel,
        labels: { style: { fontSize: '10px', colors: '#94a3b8' }, rotate: -30, hideOverlappingLabels: true },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis:      { labels: { formatter: (v: number) => this.fmtK(v), style: { fontSize: '11px', colors: '#94a3b8' } } },
      colors:     ['#3b82f6', '#ef4444'],
      stroke:     { curve: 'smooth', width: [2.5, 2], dashArray: [0, 5] },
      fill:       { type: 'gradient', gradient: { type: 'vertical', shadeIntensity: 0, opacityFrom: 0.25, opacityTo: 0.02 } },
      markers:    { size: 0, hover: { size: 5 } },
      dataLabels: { enabled: false },
      legend:     { position: 'top', horizontalAlign: 'right', fontSize: '12px', markers: { radius: 4, width: 10, height: 10 } },
      grid:       { borderColor: '#f3f4f6', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      tooltip:    { shared: true, y: { formatter: (v: number) => this.fmtCOP(v) } }
    } : null;

    // ── Bar: ventas por hora del día ─────────────────────────────────────────
    const horas     = Array.from({ length: 24 }, (_, i) => `${i}h`);
    const horasMap: Record<number, number> = {};
    d.ventas_por_hora.forEach((h: any) => { horasMap[h.hora] = Number(h.total); });
    const horasData = Array.from({ length: 24 }, (_, i) => horasMap[i] || 0);
    const maxHora   = Math.max(...horasData, 1);
    this.barHoraOpts = {
      series:      [{ name: 'Ingresos', data: horasData }],
      chart:       { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'inherit', animations: { speed: 500 } },
      xaxis:       {
        categories: horas,
        labels: { style: { fontSize: '9px', colors: '#94a3b8' } },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis:       { labels: { formatter: (v: number) => this.fmtK(v), style: { fontSize: '10px', colors: '#94a3b8' } } },
      colors:      ['#3b82f6'],
      plotOptions: {
        bar: {
          borderRadius: 4, columnWidth: '70%',
          colors: { ranges: [{ from: maxHora, to: maxHora, color: '#7c3aed' }] }
        }
      },
      dataLabels:  { enabled: false },
      grid:        { borderColor: '#f3f4f6', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      tooltip:     { y: { formatter: (v: number) => this.fmtCOP(v) } }
    };

    // ── Donut: métodos de pago ───────────────────────────────────────────────
    const metodos   = d.metodos_pago as IMetodoPago[];
    const metTotal  = metodos.reduce((s: number, m: IMetodoPago) => s + Number(m.total), 0);
    this.donutMetodosOpts = metodos.length ? {
      series:      metodos.map(m => Number(m.total)),
      chart:       { type: 'donut', height: 300, fontFamily: 'inherit', animations: { speed: 500 } },
      labels:      metodos.map(m => this.metodoPagoLabel(m.metodo_pago)),
      colors:      ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'],
      dataLabels:  { enabled: false },
      legend:      { position: 'bottom', fontSize: '11px', markers: { radius: 4, width: 10, height: 10 } },
      tooltip:     { y: { formatter: (v: number) => `${this.fmtCOP(v)} · ${metTotal ? Math.round(v / metTotal * 100) : 0}%` } },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: {
                show: true, showAlways: true, label: 'Total',
                fontSize: '12px', fontWeight: 700, color: '#374151',
                formatter: () => this.fmtK(metTotal)
              }
            }
          }
        }
      }
    } : null;

    // ── Bar: top servicios (horizontal) ──────────────────────────────────────
    const topS = (d.top_servicios as ITopServicio[]).slice(0, 8);
    this.barServiciosOpts = topS.length ? {
      series:      [{ name: 'Reservas', data: topS.map(s => s.veces_solicitado) }],
      chart:       { type: 'bar', height: Math.max(220, topS.length * 40 + 70), toolbar: { show: false }, fontFamily: 'inherit', animations: { speed: 500 } },
      xaxis:       { categories: topS.map(s => this.truncate(s.nombre_servicio, 22)), labels: { style: { fontSize: '11px' } } },
      yaxis:       { labels: { formatter: (v: number) => String(v), style: { fontSize: '11px', colors: '#94a3b8' } } },
      colors:      ['#10b981'],
      plotOptions: { bar: { borderRadius: 5, borderRadiusApplication: 'end', horizontal: true } },
      dataLabels:  { enabled: true, offsetX: 5, style: { fontSize: '10px', colors: ['#374151'], fontWeight: 600 }, formatter: (v: number) => `${v}` },
      grid:        { borderColor: '#f3f4f6', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip:     { y: { formatter: (v: number) => `${v} reservas` } }
    } : null;

    // ── Bar: top productos (horizontal) ──────────────────────────────────────
    const topP = (d.top_productos as ITopProducto[]).slice(0, 8);
    this.barProductosOpts = topP.length ? {
      series:      [{ name: 'Unidades', data: topP.map(p => Number(p.cantidad_vendida)) }],
      chart:       { type: 'bar', height: Math.max(220, topP.length * 40 + 70), toolbar: { show: false }, fontFamily: 'inherit', animations: { speed: 500 } },
      xaxis:       { categories: topP.map(p => this.truncate(p.nombre_producto, 22)), labels: { style: { fontSize: '11px' } } },
      yaxis:       { labels: { formatter: (v: number) => String(v), style: { fontSize: '11px', colors: '#94a3b8' } } },
      colors:      ['#f59e0b'],
      plotOptions: { bar: { borderRadius: 5, borderRadiusApplication: 'end', horizontal: true } },
      dataLabels:  { enabled: true, offsetX: 5, style: { fontSize: '10px', colors: ['#374151'], fontWeight: 600 }, formatter: (v: number) => `${v}` },
      grid:        { borderColor: '#f3f4f6', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip:     { y: { formatter: (v: number) => `${v} unidades` } }
    } : null;

    // ── Bar: barberos grouped (3 series) ─────────────────────────────────────
    const barbs = d.barberos as IBarberoReporte[];
    this.barBarberosOpts = barbs.length ? {
      series: [
        { name: 'Ingresos generados', data: barbs.map(b => Number(b.total_servicios)) },
        { name: 'Comisión barbero',   data: barbs.map(b => Number(b.comision_barbero)) },
        { name: 'Aporte barbería',    data: barbs.map(b => Number(b.comision_barberia)) }
      ],
      chart:       { type: 'bar', height: 340, toolbar: { show: false }, fontFamily: 'inherit', animations: { speed: 500 } },
      xaxis:       {
        categories: barbs.map(b => b.barbero),
        labels: { style: { fontSize: '11px' } },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis:       { labels: { formatter: (v: number) => this.fmtK(v), style: { fontSize: '11px', colors: '#94a3b8' } } },
      colors:      ['#3b82f6', '#f59e0b', '#10b981'],
      plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
      dataLabels:  { enabled: false },
      legend:      { position: 'top', horizontalAlign: 'right', fontSize: '12px', markers: { radius: 4, width: 10, height: 10 } },
      grid:        { borderColor: '#f3f4f6', strokeDashArray: 4 },
      tooltip:     { shared: true, y: { formatter: (v: number) => this.fmtCOP(v) } }
    } : null;

    // ── Donut: reservas por estado ────────────────────────────────────────────
    const resEstados: Record<string, number> = {};
    d.reservas_por_dia.forEach((r: any) => {
      resEstados[r.estado] = (resEstados[r.estado] || 0) + Number(r.cantidad);
    });
    const resLabels = Object.keys(resEstados);
    const resTotal  = (Object.values(resEstados) as number[]).reduce((s, n) => s + n, 0);
    this.donutReservasOpts = resLabels.length ? {
      series:      Object.values(resEstados) as number[],
      chart:       { type: 'donut', height: 280, fontFamily: 'inherit', animations: { speed: 500 } },
      labels:      resLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      colors:      ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
      dataLabels:  { enabled: false },
      legend:      { position: 'bottom', fontSize: '11px', markers: { radius: 4, width: 10, height: 10 } },
      tooltip:     { y: { formatter: (v: number) => `${v} reservas · ${resTotal ? Math.round(v / resTotal * 100) : 0}%` } },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: { show: true, showAlways: true, label: 'Total', fontSize: '12px', fontWeight: 700, color: '#374151', formatter: () => String(resTotal) }
            }
          }
        }
      }
    } : null;

    // ── Donut: créditos por estado ────────────────────────────────────────────
    const credEst   = (d.creditos?.estadisticas || []) as any[];
    const credTotal = credEst.reduce((s: number, c: any) => s + Number(c.cantidad), 0);
    this.donutCreditosOpts = credEst.length ? {
      series:      credEst.map(c => Number(c.cantidad)),
      chart:       { type: 'donut', height: 280, fontFamily: 'inherit', animations: { speed: 500 } },
      labels:      credEst.map(c => c.estado.charAt(0).toUpperCase() + c.estado.slice(1)),
      colors:      ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#94a3b8'],
      dataLabels:  { enabled: false },
      legend:      { position: 'bottom', fontSize: '11px', markers: { radius: 4, width: 10, height: 10 } },
      tooltip:     { y: { formatter: (v: number) => `${v} créditos · ${credTotal ? Math.round(v / credTotal * 100) : 0}%` } },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: { show: true, showAlways: true, label: 'Total', fontSize: '12px', fontWeight: 700, color: '#374151', formatter: () => String(credTotal) }
            }
          }
        }
      }
    } : null;

    // ── Donut: gastos por categoría ──────────────────────────────────────────
    const gastosCat    = d.gastos_por_categoria as IGastoCategoria[];
    const gastosTotal  = gastosCat.reduce((s: number, g: IGastoCategoria) => s + Number(g.total), 0);
    this.donutGastosOpts = gastosCat.length ? {
      series:      gastosCat.map(g => Number(g.total)),
      chart:       { type: 'donut', height: 300, fontFamily: 'inherit', animations: { speed: 500 } },
      labels:      gastosCat.map(g => g.categoria),
      colors:      ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'],
      dataLabels:  { enabled: false },
      legend:      { position: 'bottom', fontSize: '11px', markers: { radius: 4, width: 10, height: 10 } },
      tooltip:     { y: { formatter: (v: number) => `${this.fmtCOP(v)} · ${gastosTotal ? Math.round(v / gastosTotal * 100) : 0}%` } },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: { show: true, showAlways: true, label: 'Total', fontSize: '12px', fontWeight: 700, color: '#374151', formatter: () => this.fmtK(gastosTotal) }
            }
          }
        }
      }
    } : null;

    // ── Bar: top clientes (horizontal) ───────────────────────────────────────
    const topC = (d.top_clientes as ITopCliente[]).slice(0, 8);
    this.barClientesOpts = topC.length ? {
      series:      [{ name: 'Total gastado', data: topC.map(c => Number(c.total_gastado)) }],
      chart:       { type: 'bar', height: Math.max(220, topC.length * 40 + 70), toolbar: { show: false }, fontFamily: 'inherit', animations: { speed: 500 } },
      xaxis:       { categories: topC.map(c => this.truncate(c.cliente, 22)), labels: { style: { fontSize: '11px' } } },
      yaxis:       { labels: { formatter: (v: number) => this.fmtK(v), style: { fontSize: '11px', colors: '#94a3b8' } } },
      colors:      ['#8b5cf6'],
      plotOptions: { bar: { borderRadius: 5, borderRadiusApplication: 'end', horizontal: true } },
      dataLabels:  { enabled: true, offsetX: 5, style: { fontSize: '10px', colors: ['#374151'], fontWeight: 600 }, formatter: (v: number) => this.fmtK(v) },
      grid:        { borderColor: '#f3f4f6', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip:     { y: { formatter: (v: number) => this.fmtCOP(v) } }
    } : null;
  }

  private buildAreaChart(name: string, categories: string[], data: number[], color: string, height = 280): any {
    return {
      series:     [{ name, data }],
      chart:      { type: 'area', height, toolbar: { show: false }, fontFamily: 'inherit', animations: { speed: 500 } },
      xaxis:      {
        categories,
        labels: { style: { fontSize: '10px', colors: '#94a3b8' }, rotate: -30, hideOverlappingLabels: true },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis:      { labels: { formatter: (v: number) => this.fmtK(v), style: { fontSize: '11px', colors: '#94a3b8' } } },
      colors:     [color],
      stroke:     { curve: 'smooth', width: 2.5 },
      fill:       { type: 'gradient', gradient: { type: 'vertical', shadeIntensity: 0, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] } },
      markers:    { size: 0, hover: { size: 5, strokeWidth: 2, strokeColor: color, fillColor: '#fff' } },
      dataLabels: { enabled: false },
      grid:       { borderColor: '#f3f4f6', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      tooltip:    { y: { formatter: (v: number) => this.fmtCOP(v) }, shared: true }
    };
  }

  private truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max) + '…' : s;
  }

  // ── Exportaciones ──────────────────────────────────────────────────────────

  exportarPDF(): void {
    this.descargando = true;
    this.reporteService.descargarPDF(this.filtro).subscribe({
      next:  blob  => { this.triggerDownload(blob, `reporte_${this.filtro.fechaInicio}_${this.filtro.fechaFin}.pdf`); this.descargando = false; },
      error: ()    => { this.toast.error('Error al generar PDF'); this.descargando = false; }
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

  // ── Getters de datos ───────────────────────────────────────────────────────

  get kpis(): IKPIs | null { return this.datos?.kpis ?? null; }

  get creditosStats(): Record<string, any> {
    const map: Record<string, any> = {};
    (this.datos?.creditos?.estadisticas || []).forEach((c: any) => { map[c.estado] = c; });
    return map;
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
