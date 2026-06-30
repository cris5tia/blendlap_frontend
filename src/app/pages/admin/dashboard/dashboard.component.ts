                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ReporteService, IReporteCompleto, IKPIs } from '../../../core/services/reporte.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // ── Live data ─────────────────────────────────────────────────────────
  cargando      = true;
  data: any     = null;

  // ── Período analítico ─────────────────────────────────────────────────
  cargandoReporte = false;
  reporte: IReporteCompleto | null = null;
  descargando = false;

  // ── Rango de fechas ───────────────────────────────────────────────────
  fechaInicio!: string;
  fechaFin!:    string;

  // ── Gráficas ──────────────────────────────────────────────────────────
  chartAreaOptions:    any = null;
  chartRadialOptions:  any = null;
  donutMetodosOpts:    any = null;
  barServiciosOpts:    any = null;
  barBarberosOpts:     any = null;
  lineIngresosOpts:    any = {};
  donutGastosOpts:     any = null;
  donutReservasOpts:   any = null;
  stackedReservasOpts: any = null;

  constructor(
    private dashboardService: DashboardService,
    private reporteService:   ReporteService,
    private toast:            ToastService
  ) {
    const hoy = new Date();
    const y   = hoy.getFullYear();
    const m   = hoy.getMonth();
    this.fechaInicio = new Date(y, m, 1).toISOString().split('T')[0];
    this.fechaFin    = new Date(y, m + 1, 0).toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargarLive();
    this.cargarReporte();
  }

  // ── Live ──────────────────────────────────────────────────────────────
  cargarLive(): void {
    this.cargando = true;
    this.dashboardService.getResumenAdmin().subscribe({
      next:  r => { this.data = r.data; this.cargando = false; },
      error: () => { this.toast.error('Error al cargar datos en vivo'); this.cargando = false; }
    });
  }

  // ── Período analítico ─────────────────────────────────────────────────
  cargarReporte(): void {
    this.cargandoReporte = true;
    this.reporteService.getCompleto({ fechaInicio: this.fechaInicio, fechaFin: this.fechaFin }).subscribe({
      next:  r => { this.reporte = r.data; this.buildCharts(); this.cargandoReporte = false; },
      error: () => { this.toast.error('Error al cargar analítica'); this.cargandoReporte = false; }
    });
  }

  aplicarFiltro(): void { this.cargarReporte(); }

  get periodoLabel(): string {
    if (!this.fechaInicio || !this.fechaFin) return '';
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const ini = new Date(this.fechaInicio + 'T12:00:00');
    const fin = new Date(this.fechaFin   + 'T12:00:00');
    const mismoAnio = ini.getFullYear() === fin.getFullYear();
    const mismoMes  = mismoAnio && ini.getMonth() === fin.getMonth();
    if (mismoMes)  return `${ini.getDate()}–${fin.getDate()} ${meses[ini.getMonth()]} ${ini.getFullYear()}`;
    if (mismoAnio) return `${ini.getDate()} ${meses[ini.getMonth()]} – ${fin.getDate()} ${meses[fin.getMonth()]} ${ini.getFullYear()}`;
    return `${ini.getDate()} ${meses[ini.getMonth()]} ${ini.getFullYear()} – ${fin.getDate()} ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
  }

  get diffDias(): number {
    if (!this.fechaInicio || !this.fechaFin) return 30;
    const ini = new Date(this.fechaInicio + 'T12:00:00').getTime();
    const fin = new Date(this.fechaFin   + 'T12:00:00').getTime();
    return Math.round((fin - ini) / 86400000);
  }

  // ── Chart builders ────────────────────────────────────────────────────
  buildCharts(): void {
    if (!this.reporte) return;
    this.buildAreaChart();
    this.buildRadialChart();
    this.buildDonutMetodos();
    this.buildBarServicios();
    this.buildBarBarberos();
    this.buildDetalle();
  }

  buildAreaChart(): void {
    const ventas = this.reporte!.ventas_por_dia;
    const gastos = this.reporte!.gastos_por_dia;
    let labels: string[], ingData: number[], gastoData: number[];

    if (this.diffDias > 60) {
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
    const rotate   = labels.length > 14 ? -45 : labels.length > 7 ? -30 : 0;

    this.chartAreaOptions = labels.length ? {
      series: [
        { name: 'Ingresos',      type: 'bar',  data: ingData   },
        { name: 'Gastos',        type: 'bar',  data: gastoData },
        { name: 'Ganancia neta', type: 'line', data: netaData  },
      ],
      chart: {
        type: 'bar', height: 280,
        toolbar: { show: false },
        background: 'transparent',
        fontFamily: 'inherit',
        animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 80 } },
        parentHeightOffset: 0
      },
      colors: ['#fbc447', '#ef4444', '#10b981'],
      plotOptions: { bar: { columnWidth: labels.length > 20 ? '80%' : '55%', borderRadius: 3, borderRadiusApplication: 'end' } },
      stroke: { width: [0, 0, 2.5], curve: 'smooth' },
      markers: { size: [0, 0, 3.5], strokeWidth: 2, strokeColors: '#fff', hover: { size: 5 } },
      dataLabels: { enabled: false },
      fill: { type: ['solid','solid','gradient'],
        gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0, opacityFrom: 1, opacityTo: 1 }
      },
      xaxis: {
        categories: labels,
        axisBorder: { show: false }, axisTicks: { show: false },
        labels: { style: { colors: '#9ca3af', fontSize: '10px', fontFamily: 'inherit' }, rotate, maxHeight: 60 }
      },
      yaxis: [
        { seriesName: 'Ingresos', labels: { formatter: (v: number) => this.fmtShort(v), style: { colors: ['#9ca3af'], fontSize: '9px' } }, min: 0 },
        { seriesName: 'Gastos', show: false, min: 0 },
        { seriesName: 'Ganancia neta', opposite: true, labels: { formatter: (v: number) => this.fmtShort(v), style: { colors: ['#10b981'], fontSize: '9px' } } }
      ],
      grid: { borderColor: 'rgba(0,0,0,0.06)', strokeDashArray: 3, padding: { left: 0, right: 8, top: 4, bottom: 0 } },
      tooltip: {
        theme: 'light', shared: true, intersect: false,
        y: { formatter: (v: number) => this.formatCurrency(v) },
        style: { fontSize: '12px', fontFamily: 'inherit' }
      },
      legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '11px',
        markers: { width: 8, height: 8, radius: 4 }, itemMargin: { horizontal: 8 }
      }
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
      chart: { type: 'radialBar', height: 300, toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit', animations: { enabled: true, speed: 800 } },
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
      dataLabels: { enabled: false }
    };
  }

  buildDonutMetodos(): void {
    const metodos  = this.reporte!.metodos_pago;
    const metTotal = metodos.reduce((s: number, m: any) => s + Number(m.total), 0);
    const PALETTE  = ['#fbc447','#dc3545','#28a745','#17a2b8','#6f42c1','#fd7e14'];
    this.donutMetodosOpts = metodos.length ? {
      series:      metodos.map((m: any) => Number(m.total)),
      chart:       { type: 'donut', height: 270, fontFamily: 'inherit', toolbar: { show: false }, animations: { speed: 500 } },
      labels:      metodos.map((m: any) => this.metodoPagoLabel(m.metodo_pago)),
      colors:      PALETTE,
      dataLabels:  { enabled: false },
      legend:      { position: 'bottom', fontSize: '11px', markers: { radius: 4, width: 10, height: 10 } },
      tooltip:     { y: { formatter: (v: number) => `${this.formatCurrency(v)} · ${metTotal ? Math.round(v / metTotal * 100) : 0}%` } },
      plotOptions: {
        pie: {
          donut: {
            size: '66%',
            labels: {
              show: true,
              total: { show: true, showAlways: true, label: 'Total', fontSize: '12px', fontWeight: 700, color: '#374151', formatter: () => this.fmtShort(metTotal) }
            }
          }
        }
      }
    } : null;
  }

  buildBarServicios(): void {
    const top = this.reporte!.top_servicios.slice(0, 7);
    this.barServiciosOpts = top.length ? {
      series:      [{ name: 'Reservas', data: top.map((s: any) => s.veces_solicitado) }],
      chart:       { type: 'bar', height: Math.max(220, top.length * 38 + 60), toolbar: { show: false }, fontFamily: 'inherit', animations: { speed: 500 } },
      xaxis:       { categories: top.map((s: any) => s.nombre_servicio.length > 22 ? s.nombre_servicio.slice(0, 22) + '…' : s.nombre_servicio), labels: { style: { fontSize: '11px' } } },
      yaxis:       { labels: { formatter: (v: number) => String(v), style: { fontSize: '11px', colors: '#94a3b8' } } },
      colors:      ['#fbc447'],
      plotOptions: { bar: { borderRadius: 5, borderRadiusApplication: 'end', horizontal: true } },
      dataLabels:  { enabled: true, offsetX: 5, style: { fontSize: '10px', colors: ['#374151'], fontWeight: 600 }, formatter: (v: number) => `${v}` },
      grid:        { borderColor: '#f3f4f6', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip:     { y: { formatter: (_v: number, opts: any) => {
        const s = top[opts.dataPointIndex];
        return `${s.veces_solicitado} reservas · ${this.formatCurrency(s.total_generado)}`;
      }}}
    } : null;
  }

  buildBarBarberos(): void {
    const sorted = [...(this.reporte!.barberos || [])].sort(
      (a: any, b: any) => Number(b.total_servicios) - Number(a.total_servicios)
    );
    const BPALET = ['#fbc447','#1a1a2e','#10b981','#3b82f6','#8b5cf6','#f97316','#ec4899','#06b6d4'];
    this.barBarberosOpts = sorted.length ? {
      series: [{
        name: 'Ingresos generados',
        data: sorted.map((b: any, i: number) => ({
          x: b.barbero.split(' ')[0],
          y: Number(b.total_servicios),
          fillColor: BPALET[i % BPALET.length]
        }))
      }],
      chart: {
        type: 'bar', height: Math.max(260, sorted.length * 62 + 80),
        toolbar: { show: false }, fontFamily: 'inherit',
        animations: { enabled: true, speed: 700, animateGradually: { enabled: true, delay: 100 } },
        parentHeightOffset: 0
      },
      plotOptions: {
        bar: {
          distributed: true, borderRadius: 8, borderRadiusApplication: 'end',
          horizontal: true, barHeight: '48%',
          dataLabels: { position: 'center' }
        }
      },
      dataLabels: {
        enabled: true, textAnchor: 'middle', offsetX: 0,
        style: { fontSize: '11px', fontWeight: 700, colors: ['#fff'] },
        formatter: (v: number) => {
          if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(3).replace(/\.?0+$/, '') + 'M';
          if (v >= 1_000) return '$' + (v / 1_000).toFixed(0) + 'K';
          return '$' + Math.round(v);
        }
      },
      xaxis: {
        labels: { formatter: (v: string) => this.fmtShort(Number(v)), style: { colors: '#9ca3af', fontSize: '10px' } },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis: {
        labels: { style: { colors: '#374151', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit' } }
      },
      legend: { show: false },
      grid: { borderColor: 'rgba(0,0,0,0.06)', strokeDashArray: 3, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip: {
        y: { formatter: (_v: number, opts: any) => {
          const b = sorted[opts.dataPointIndex];
          return `${this.formatCurrency(b.total_servicios)} · ${b.total_reservas} reservas`;
        }},
        style: { fontSize: '12px', fontFamily: 'inherit' }
      }
    } : null;
  }

  private buildDetalle(): void {
    const d = this.reporte!;

    // ── Área: ingresos por día ─────────────────────────────────────────────
    const diasLabel = (d.ventas_por_dia || []).map((v: any) => this.fmtDia(v.dia));
    const diasData  = (d.ventas_por_dia || []).map((v: any) => Number(v.total));
    this.lineIngresosOpts = this.buildAreaDetalle('Ingresos', diasLabel, diasData, '#fbc447', '#1a1a2e');

    // ── Donut: gastos por categoría ────────────────────────────────────────
    const gastosCat = (d.gastos_por_categoria || []) as any[];
    const totalGas  = gastosCat.reduce((s: number, g: any) => s + Number(g.total), 0);
    this.donutGastosOpts = gastosCat.length ? {
      series:  gastosCat.map((g: any) => Number(g.total)),
      chart:   { type: 'donut', height: 340, fontFamily: 'inherit',
                 animations: { enabled: true, speed: 600 }, toolbar: { show: false } },
      labels:  gastosCat.map((g: any) => g.categoria),
      colors:  ['#ef4444','#f97316','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16','#14b8a6'],
      dataLabels: { enabled: true,
        formatter: (_val: number, opts: any) =>
          `${Math.round(opts.w.globals.seriesPercent[opts.seriesIndex])}%`,
        style: { fontSize: '11px', fontFamily: 'inherit', fontWeight: 700 },
        dropShadow: { enabled: false }
      },
      legend: { position: 'right', fontSize: '12px', fontFamily: 'inherit',
                markers: { width: 10, height: 10, radius: 4 },
                formatter: (name: string, opts: any) =>
                  `${name} — ${this.formatCurrency(opts.w.globals.series[opts.seriesIndex])}` },
      plotOptions: { pie: { donut: { size: '64%',
        labels: { show: true, total: { show: true, showAlways: true, label: 'Total gastos',
          fontSize: '12px', color: '#374151', fontWeight: 700,
          formatter: () => this.fmtShort(totalGas) } } } } },
      stroke:  { width: 3, colors: ['#fff'] },
      tooltip: { y: { formatter: (v: number) => `${this.formatCurrency(v)} · ${totalGas ? Math.round(v / totalGas * 100) : 0}%` },
                 style: { fontSize: '12px', fontFamily: 'inherit' } }
    } : null;

    // ── Donut: reservas por estado ─────────────────────────────────────────
    const resEstados: Record<string, number> = {};
    (d.reservas_por_dia || []).forEach((r: any) => {
      resEstados[r.estado] = (resEstados[r.estado] || 0) + Number(r.cantidad);
    });
    const resLabels = Object.keys(resEstados);
    const resColors: Record<string, string> = { completada: '#10b981', confirmada: '#3b82f6', pendiente: '#f59e0b', cancelada: '#ef4444' };
    this.donutReservasOpts = resLabels.length ? {
      series:      Object.values(resEstados),
      chart:       { type: 'donut', height: 280, fontFamily: 'inherit', animations: { enabled: true, speed: 600 } },
      labels:      resLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      colors:      resLabels.map(l => resColors[l] || '#6b7280'),
      dataLabels:  { enabled: true, formatter: (_val: number, opts: any) =>
        `${Math.round(opts.w.globals.seriesPercent[opts.seriesIndex])}%`,
        style: { fontSize: '11px', fontFamily: 'inherit', fontWeight: 700 }, dropShadow: { enabled: false }
      },
      legend:      { position: 'bottom', fontSize: '12px', fontFamily: 'inherit', markers: { width: 9, height: 9, radius: 3 } },
      plotOptions: { pie: { donut: { size: '62%',
        labels: { show: true, total: { show: true, label: 'Total', fontSize: '12px', color: '#1a1a2e',
          formatter: (w: any) => String(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)) } } } } },
      stroke:      { width: 2, colors: ['#fff'] },
      tooltip:     { style: { fontSize: '12px', fontFamily: 'inherit' } }
    } : null;

    // ── Stacked bar: reservas por estado por día ───────────────────────────
    const resDiasMap: Record<string, Record<string, number>> = {};
    const resEstadosList: string[] = [];
    (d.reservas_por_dia || []).forEach((r: any) => {
      const dia = String(r.dia).split('T')[0];
      if (!resDiasMap[dia]) resDiasMap[dia] = {};
      resDiasMap[dia][r.estado] = (resDiasMap[dia][r.estado] || 0) + Number(r.cantidad);
      if (!resEstadosList.includes(r.estado)) resEstadosList.push(r.estado);
    });
    const sortedResDias = Object.keys(resDiasMap).sort();
    const resStateColors: Record<string, string> = {
      completada: '#10b981', confirmada: '#3b82f6', pendiente: '#f59e0b', cancelada: '#ef4444'
    };
    this.stackedReservasOpts = sortedResDias.length ? {
      series: resEstadosList.map(estado => ({
        name: estado.charAt(0).toUpperCase() + estado.slice(1),
        data: sortedResDias.map(dia => resDiasMap[dia][estado] || 0)
      })),
      chart: { type: 'bar', stacked: true, height: 280, toolbar: { show: false }, fontFamily: 'inherit',
               animations: { enabled: true, speed: 600 }, parentHeightOffset: 0 },
      colors: resEstadosList.map(e => resStateColors[e] || '#6b7280'),
      plotOptions: { bar: { columnWidth: sortedResDias.length > 20 ? '85%' : '55%', borderRadius: 0 } },
      xaxis: {
        categories: sortedResDias.map(d => this.fmtDia(d)),
        axisBorder: { show: false }, axisTicks: { show: false },
        labels: { style: { colors: '#9ca3af', fontSize: '10px' }, rotate: sortedResDias.length > 14 ? -45 : 0 }
      },
      yaxis: { labels: { formatter: (v: number) => String(v), style: { colors: ['#9ca3af'], fontSize: '9px' } }, min: 0 },
      dataLabels: { enabled: false },
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px',
                markers: { width: 9, height: 9, radius: 3 }, itemMargin: { horizontal: 8 } },
      grid: { borderColor: 'rgba(0,0,0,0.06)', strokeDashArray: 3 },
      tooltip: { shared: true, intersect: false, style: { fontSize: '12px', fontFamily: 'inherit' } }
    } : null;

  }

  private buildAreaDetalle(name: string, categories: string[], data: number[], color: string, gradColor: string): any {
    const rotate = categories.length > 14 ? -45 : categories.length > 7 ? -30 : 0;
    return {
      series:     [{ name, data }],
      chart:      { type: 'area', height: 260, toolbar: { show: false }, fontFamily: 'inherit', parentHeightOffset: 0,
                    animations: { enabled: true, speed: 500 } },
      xaxis:      { categories, axisBorder: { show: false }, axisTicks: { show: false },
                    labels: { style: { colors: '#9ca3af', fontSize: '10px', fontFamily: 'inherit' }, rotate, maxHeight: 60 } },
      yaxis:      { labels: { formatter: (v: number) => this.fmtShort(v), style: { colors: ['#9ca3af'], fontSize: '9px' } } },
      colors:     [color],
      stroke:     { curve: 'smooth', width: 2.5 },
      fill:       { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.15,
                    gradientToColors: [gradColor], opacityFrom: 0.35, opacityTo: 0.02 } },
      dataLabels: { enabled: false },
      markers:    { size: categories.length < 15 ? 3 : 0, strokeWidth: 2, strokeColors: '#fff', hover: { size: 5 } },
      grid:       { borderColor: 'rgba(0,0,0,0.06)', strokeDashArray: 3, padding: { left: 0, right: 8 } },
      tooltip:    { y: { formatter: (v: number) => this.formatCurrency(v) }, style: { fontSize: '12px', fontFamily: 'inherit' } }
    };
  }

  // ── Exports ───────────────────────────────────────────────────────────
  exportarPDF(): void {
    this.descargando = true;
    this.reporteService.descargarPDF({ fechaInicio: this.fechaInicio, fechaFin: this.fechaFin }).subscribe({
      next:  blob => { this.triggerDownload(blob, `reporte_${this.fechaInicio}_${this.fechaFin}.pdf`); this.descargando = false; },
      error: ()   => { this.toast.error('Error al generar PDF'); this.descargando = false; }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Getters ───────────────────────────────────────────────────────────
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

  get creditosStats(): Record<string, any> {
    const map: Record<string, any> = {};
    (this.reporte?.creditos?.estadisticas || []).forEach((c: any) => { map[c.estado] = c; });
    return map;
  }

  // ── Formato ───────────────────────────────────────────────────────────
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

  estadoCreditoClass(e: string): string {
    const map: Record<string, string> = {
      pendiente: 'badge-warning', activo: 'badge-info', pagado: 'badge-success',
      vencido: 'badge-danger', rechazado: 'badge-rechazado'
    };
    return map[e] || 'badge-default';
  }
}
