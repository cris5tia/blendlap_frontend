import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ReporteService, IReporteCompleto, IKPIs } from '../../../core/services/reporte.service';
import { ToastService } from '../../../core/services/toast.service';

export type TipoPeriodo = 'semanal' | 'quincenal' | 'mensual' | 'anual';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // ── Live data (siempre hoy / mes actual) ─────────────────────
  cargando      = true;
  data: any     = null;
  reservaDetalle: any = null;

  // ── Período analítico ────────────────────────────────────────
  cargandoReporte = false;
  reporte: IReporteCompleto | null = null;
  descargando = false;

  // ── Selector de período ──────────────────────────────────────
  tipoPeriodo: TipoPeriodo = 'mensual';

  // Semanal / Quincenal → date picker
  selectedDate: string;

  // Mensual → month picker
  selectedMonth: string;

  // Anual → year select
  selectedYear: number;
  anioOpciones: number[] = [];

  // ── Gráficas ─────────────────────────────────────────────────
  chartAreaOptions:    any = null;
  chartRadialOptions:  any = null;
  donutMetodosOpts:    any = null;
  barServiciosOpts:    any = null;
  barBarberosOpts:     any = null;

  constructor(
    private dashboardService: DashboardService,
    private reporteService:   ReporteService,
    private toast:            ToastService
  ) {
    const hoy    = new Date();
    const year   = hoy.getFullYear();
    const month  = String(hoy.getMonth() + 1).padStart(2, '0');
    this.selectedDate  = hoy.toISOString().split('T')[0];
    this.selectedMonth = `${year}-${month}`;
    this.selectedYear  = year;
    this.anioOpciones  = [year - 2, year - 1, year];
  }

  ngOnInit(): void {
    this.cargarLive();
    this.cargarReporte();
  }

  // ── Live: reservasHoy, ultimasReservas, topBarbero ───────────
  cargarLive(): void {
    this.cargando = true;
    this.dashboardService.getResumenAdmin().subscribe({
      next: r => { this.data = r.data; this.cargando = false; },
      error: () => { this.toast.error('Error al cargar datos en vivo'); this.cargando = false; }
    });
  }

  // ── Período analítico ────────────────────────────────────────
  cargarReporte(): void {
    const { fechaInicio, fechaFin } = this.computeFechas();
    this.cargandoReporte = true;
    this.reporteService.getCompleto({ fechaInicio, fechaFin }).subscribe({
      next:  r => { this.reporte = r.data; this.buildCharts(); this.cargandoReporte = false; },
      error: () => { this.toast.error('Error al cargar analítica'); this.cargandoReporte = false; }
    });
  }

  onPeriodoChange(): void { this.cargarReporte(); }
  onDateChange():   void { this.cargarReporte(); }

  // ── Cálculo de fechas ────────────────────────────────────────
  computeFechas(): { fechaInicio: string; fechaFin: string } {
    switch (this.tipoPeriodo) {

      case 'semanal': {
        const d   = new Date(this.selectedDate + 'T12:00:00');
        const dow = d.getDay(); // 0=Dom
        const diffLun = dow === 0 ? -6 : 1 - dow;
        const lun = new Date(d); lun.setDate(d.getDate() + diffLun);
        const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
        return { fechaInicio: this.toISO(lun), fechaFin: this.toISO(dom) };
      }

      case 'quincenal': {
        const d      = new Date(this.selectedDate + 'T12:00:00');
        const year   = d.getFullYear();
        const month  = d.getMonth();
        const day    = d.getDate();
        if (day <= 15) {
          const ini = new Date(year, month, 1);
          const fin = new Date(year, month, 15);
          return { fechaInicio: this.toISO(ini), fechaFin: this.toISO(fin) };
        } else {
          const ini = new Date(year, month, 16);
          const fin = new Date(year, month + 1, 0); // último día del mes
          return { fechaInicio: this.toISO(ini), fechaFin: this.toISO(fin) };
        }
      }

      case 'mensual': {
        const [y, m] = this.selectedMonth.split('-').map(Number);
        const ini    = new Date(y, m - 1, 1);
        const fin    = new Date(y, m, 0);
        return { fechaInicio: this.toISO(ini), fechaFin: this.toISO(fin) };
      }

      case 'anual': {
        return {
          fechaInicio: `${this.selectedYear}-01-01`,
          fechaFin:    `${this.selectedYear}-12-31`
        };
      }
    }
  }

  private toISO(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  // ── Etiqueta del período activo ──────────────────────────────
  get periodoLabel(): string {
    const { fechaInicio, fechaFin } = this.computeFechas();
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const ini   = new Date(fechaInicio + 'T12:00:00');
    const fin   = new Date(fechaFin   + 'T12:00:00');

    if (this.tipoPeriodo === 'anual') {
      return String(this.selectedYear);
    }
    if (this.tipoPeriodo === 'mensual') {
      return `${meses[ini.getMonth()]} ${ini.getFullYear()}`;
    }
    // semanal / quincenal
    const mismoMes = ini.getMonth() === fin.getMonth() && ini.getFullYear() === fin.getFullYear();
    if (mismoMes) {
      return `${ini.getDate()}–${fin.getDate()} ${meses[ini.getMonth()]} ${ini.getFullYear()}`;
    }
    return `${ini.getDate()} ${meses[ini.getMonth()]} – ${fin.getDate()} ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
  }

  // ── Construcción de gráficas ─────────────────────────────────
  buildCharts(): void {
    if (!this.reporte) return;
    this.buildAreaChart();
    this.buildRadialChart();
    this.buildDonutMetodos();
    this.buildBarServicios();
    this.buildBarBarberos();
  }

  buildAreaChart(): void {
    const ventas = this.reporte!.ventas_por_dia;
    const gastos = this.reporte!.gastos_por_dia;

    let labels:    string[];
    let ingData:   number[];
    let gastoData: number[];

    if (this.tipoPeriodo === 'anual') {
      // Agrupar siempre por mes para vista anual
      const map: Record<string, { ing: number; gas: number }> = {};
      ventas.forEach((v: any) => {
        const k = String(v.dia).substring(0, 7);
        if (!map[k]) map[k] = { ing: 0, gas: 0 };
        map[k].ing += Number(v.total);
      });
      gastos.forEach((g: any) => {
        const k = String(g.dia).substring(0, 7);
        if (!map[k]) map[k] = { ing: 0, gas: 0 };
        map[k].gas += Number(g.total);
      });
      const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
      labels    = sorted.map(([m]) => this.getMesNombre(m));
      ingData   = sorted.map(([, v]) => v.ing);
      gastoData = sorted.map(([, v]) => v.gas);
    } else {
      const gastoMap: Record<string, number> = {};
      gastos.forEach((g: any) => { gastoMap[String(g.dia).split('T')[0]] = Number(g.total); });
      labels    = ventas.map((v: any) => this.fmtDia(String(v.dia)));
      ingData   = ventas.map((v: any) => Number(v.total));
      gastoData = ventas.map((v: any) => gastoMap[String(v.dia).split('T')[0]] || 0);
    }

    const netaData = ingData.map((ing, i) => ing - gastoData[i]);

    this.chartAreaOptions = labels.length ? {
      series: [
        { name: 'Ingresos',      type: 'bar',  data: ingData   },
        { name: 'Gastos',        type: 'bar',  data: gastoData },
        { name: 'Ganancia neta', type: 'line', data: netaData  },
      ],
      chart: {
        type: 'bar', height: 260,
        toolbar: { show: false }, background: 'transparent',
        fontFamily: 'inherit',
        animations: { enabled: true, speed: 500 }
      },
      colors: ['#fbc447', '#dc3545', '#28a745'],
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 4, borderRadiusApplication: 'end' } },
      stroke: { width: [0, 0, 3], curve: 'smooth' },
      markers: { size: [0, 0, 4], strokeWidth: 2, strokeColors: '#fff', hover: { size: 6 } },
      dataLabels: { enabled: false },
      fill: { type: ['solid','solid','solid'], opacity: [0.88, 0.88, 1] },
      xaxis: {
        categories: labels,
        axisBorder: { show: false }, axisTicks: { show: false },
        labels: { style: { colors: '#adb5bd', fontSize: '10px' }, rotate: labels.length > 10 ? -30 : 0 }
      },
      yaxis: [
        { seriesName: 'Ingresos',      labels: { formatter: (v: number) => this.fmtShort(v), style: { colors: '#adb5bd', fontSize: '10px' } }, min: 0 },
        { seriesName: 'Gastos',        show: false, min: 0 },
        { seriesName: 'Ganancia neta', opposite: true, labels: { formatter: (v: number) => this.fmtShort(v), style: { colors: '#28a745', fontSize: '10px' } } }
      ],
      grid: { borderColor: 'rgba(0,0,0,0.05)', strokeDashArray: 4, padding: { left: 4, right: 4 } },
      tooltip: { theme: 'light', shared: true, intersect: false, y: { formatter: (v: number) => this.formatCurrency(v) } },
      legend: { show: false }
    } : null;
  }

  buildRadialChart(): void {
    const kpis = this.reporte!.kpis as IKPIs;
    const ing  = kpis.ingresos_total || 0;
    const gas  = kpis.total_gastos   || 0;
    const net  = kpis.ganancia_neta  || 0;
    const max  = ing || 1;

    const pGas = Math.min(Math.round((gas / max) * 100), 100);
    const pNet = net >= 0 ? Math.min(Math.round((net / max) * 100), 100) : 0;
    const margen = ing > 0 ? Math.round((net / ing) * 100) : 0;

    this.chartRadialOptions = {
      series: [100, pGas, pNet],
      chart: {
        type: 'radialBar', height: 300,
        toolbar: { show: false }, background: 'transparent',
        fontFamily: 'inherit', animations: { enabled: true, speed: 800 }
      },
      labels: ['Ingresos', 'Gastos', 'Ganancia neta'],
      colors: ['#fbc447', '#dc3545', '#28a745'],
      plotOptions: {
        radialBar: {
          hollow: { size: '28%', background: 'transparent' },
          track:  { background: 'rgba(0,0,0,0.05)', strokeWidth: '100%', margin: 6 },
          dataLabels: {
            show: true,
            name:  { fontSize: '12px', color: '#adb5bd', offsetY: -4 },
            value: { fontSize: '15px', fontWeight: 700, color: '#1a1a1a', offsetY: 4, formatter: (v: number) => v + '%' },
            total: { show: true, label: 'Margen neto', fontSize: '11px', color: '#adb5bd', formatter: () => margen + '%' }
          },
          startAngle: -135, endAngle: 135
        }
      },
      stroke: { lineCap: 'round' },
      fill: { type: 'solid' },
      legend: { show: false },
      responsive: [{ breakpoint: 480, options: { chart: { height: 250 } } }],
      dataLabels: { enabled: false }
    };
  }

  buildDonutMetodos(): void {
    const metodos = this.reporte!.metodos_pago;
    const PALETTE = ['#fbc447','#dc3545','#28a745','#17a2b8','#6f42c1','#fd7e14'];
    this.donutMetodosOpts = metodos.length ? {
      series: metodos.map((m: any) => Number(m.total)),
      chart:  { type: 'donut', height: 240, fontFamily: 'inherit', toolbar: { show: false } },
      labels: metodos.map((m: any) => this.metodoPagoLabel(m.metodo_pago)),
      colors: PALETTE,
      dataLabels: { enabled: false },
      legend: { position: 'bottom', fontSize: '11px' },
      tooltip: { y: { formatter: (v: number) => this.formatCurrency(v) } },
      plotOptions: { pie: { donut: { size: '65%' } } }
    } : null;
  }

  buildBarServicios(): void {
    const top = this.reporte!.top_servicios.slice(0, 6);
    this.barServiciosOpts = top.length ? {
      series:      [{ name: 'Veces', data: top.map((s: any) => s.veces_solicitado) }],
      chart:       { type: 'bar', height: 240, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis:       { categories: top.map((s: any) => s.nombre_servicio), labels: { style: { fontSize: '10px' } } },
      yaxis:       { labels: { formatter: (v: number) => String(v) } },
      colors:      ['#fbc447'],
      plotOptions: { bar: { borderRadius: 5, horizontal: true } },
      dataLabels:  { enabled: false },
      grid:        { borderColor: '#f1f3f5' },
      tooltip:     { y: { formatter: (_v: number, opts: any) => {
        const s = top[opts.dataPointIndex];
        return `${s.veces_solicitado} veces · ${this.formatCurrency(s.total_generado)}`;
      }}}
    } : null;
  }

  buildBarBarberos(): void {
    const barbs = this.reporte!.barberos;
    this.barBarberosOpts = barbs.length ? {
      series: [
        { name: 'Ingresos generados', data: barbs.map((b: any) => Number(b.total_servicios)) },
        { name: 'Comisión barbero',   data: barbs.map((b: any) => Number(b.comision_barbero)) },
      ],
      chart:       { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis:       { categories: barbs.map((b: any) => b.barbero), labels: { style: { fontSize: '10px' } } },
      yaxis:       { labels: { formatter: (v: number) => this.fmtShort(v) } },
      colors:      ['#1a1a2e', '#fbc447'],
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
      dataLabels:  { enabled: false },
      legend:      { position: 'top', fontSize: '11px' },
      grid:        { borderColor: '#f1f3f5' },
      tooltip:     { y: { formatter: (v: number) => this.formatCurrency(v) } }
    } : null;
  }

  // ── PDF export ───────────────────────────────────────────────
  exportarPDF(): void {
    const { fechaInicio, fechaFin } = this.computeFechas();
    this.descargando = true;
    this.reporteService.descargarPDF({ fechaInicio, fechaFin }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href = url; a.download = `reporte_${fechaInicio}_${fechaFin}.pdf`;
        a.click(); URL.revokeObjectURL(url);
        this.descargando = false;
      },
      error: () => { this.toast.error('Error al generar PDF'); this.descargando = false; }
    });
  }

  // ── Modal detalle reserva ────────────────────────────────────
  abrirDetalleReserva(r: any): void  { this.reservaDetalle = r; }
  cerrarDetalleReserva(): void       { this.reservaDetalle = null; }

  // ── Getters KPIs período ─────────────────────────────────────
  get kpis(): IKPIs | null { return this.reporte?.kpis ?? null; }

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

  get maxIngresosBarbero(): number {
    if (!this.reporte?.barberos?.length) return 1;
    return Math.max(...this.reporte.barberos.map((b: any) => Number(b.total_servicios))) || 1;
  }

  porcentajeBarbero(ingresos: number): number {
    return Math.round((ingresos / this.maxIngresosBarbero) * 100);
  }

  // ── Formato ──────────────────────────────────────────────────
  formatCurrency(v: number | undefined | null): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v ?? 0);
  }

  fmtShort(v: number): string {
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return '$' + (v / 1_000).toFixed(0) + 'K';
    return '$' + Math.round(v);
  }

  fmtDia(dia: string): string {
    if (!dia) return '';
    const d = new Date(dia.split('T')[0] + 'T12:00:00');
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${m[d.getMonth()]}`;
  }

  getMesNombre(mesStr: string): string {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return meses[parseInt(mesStr.split('-')[1]) - 1];
  }

  metodoPagoLabel(m: string): string {
    const map: Record<string, string> = {
      efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia',
      nequi: 'Nequi', otro: 'Online', credito: 'Crédito'
    };
    return map[m] || m;
  }

  getEstadoClass(estado: string): string {
    const map: any = {
      completada: 'badge-success', pendiente: 'badge-warning',
      cancelada: 'badge-danger', confirmada: 'badge-info'
    };
    return map[estado] || 'badge-default';
  }
}
