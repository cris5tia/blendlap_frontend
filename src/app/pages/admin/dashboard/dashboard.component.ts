                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ReporteService, IReporteCompleto, IKPIs } from '../../../core/services/reporte.service';
import { ToastService } from '../../../core/services/toast.service';

export type TipoPeriodo = 'semanal' | 'quincenal' | 'mensual' | 'anual';
export type DashTab = 'general' | 'ventas' | 'reservas' | 'barberos' | 'creditos' | 'clientes' | 'gastos';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // ── Live data ─────────────────────────────────────────────────────────
  cargando      = true;
  data: any     = null;
  reservaDetalle: any = null;

  // ── Período analítico ─────────────────────────────────────────────────
  cargandoReporte = false;
  reporte: IReporteCompleto | null = null;
  descargando = false;

  // ── Selector de período ───────────────────────────────────────────────
  tipoPeriodo: TipoPeriodo = 'mensual';
  selectedDate: string;
  selectedMonth: string;
  selectedYear: number;
  anioOpciones: number[] = [];

  // ── Tab activo ────────────────────────────────────────────────────────
  tabActivo: DashTab = 'general';

  // ── Gráficas (tab General) ────────────────────────────────────────────
  chartAreaOptions:   any = null;
  chartRadialOptions: any = null;
  donutMetodosOpts:   any = null;
  barServiciosOpts:   any = null;
  barBarberosOpts:    any = null;

  // ── Gráficas (tabs detalle) ───────────────────────────────────────────
  lineIngresosOpts:  any = {};
  lineGastosOpts:    any = {};
  barHoraOpts:       any = {};
  barProductosOpts:  any = null;
  donutReservasOpts: any = null;
  donutCreditosOpts: any = null;
  donutGastosOpts:   any = null;
  barClientesOpts:   any = null;

  constructor(
    private dashboardService: DashboardService,
    private reporteService:   ReporteService,
    private toast:            ToastService
  ) {
    const hoy   = new Date();
    const year  = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    this.selectedDate  = hoy.toISOString().split('T')[0];
    this.selectedMonth = `${year}-${month}`;
    this.selectedYear  = year;
    this.anioOpciones  = [year - 2, year - 1, year];
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
    const { fechaInicio, fechaFin } = this.computeFechas();
    this.cargandoReporte = true;
    this.reporteService.getCompleto({ fechaInicio, fechaFin }).subscribe({
      next:  r => { this.reporte = r.data; this.buildCharts(); this.cargandoReporte = false; },
      error: () => { this.toast.error('Error al cargar analítica'); this.cargandoReporte = false; }
    });
  }

  onPeriodoChange(): void { this.cargarReporte(); }
  onDateChange():   void { this.cargarReporte(); }

  // ── Cálculo de fechas ─────────────────────────────────────────────────
  computeFechas(): { fechaInicio: string; fechaFin: string } {
    switch (this.tipoPeriodo) {
      case 'semanal': {
        const d   = new Date(this.selectedDate + 'T12:00:00');
        const dow = d.getDay();
        const diffLun = dow === 0 ? -6 : 1 - dow;
        const lun = new Date(d); lun.setDate(d.getDate() + diffLun);
        const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
        return { fechaInicio: this.toISO(lun), fechaFin: this.toISO(dom) };
      }
      case 'quincenal': {
        const d     = new Date(this.selectedDate + 'T12:00:00');
        const year  = d.getFullYear();
        const month = d.getMonth();
        const day   = d.getDate();
        if (day <= 15) {
          return { fechaInicio: this.toISO(new Date(year, month, 1)), fechaFin: this.toISO(new Date(year, month, 15)) };
        } else {
          return { fechaInicio: this.toISO(new Date(year, month, 16)), fechaFin: this.toISO(new Date(year, month + 1, 0)) };
        }
      }
      case 'mensual': {
        const [y, m] = this.selectedMonth.split('-').map(Number);
        return { fechaInicio: this.toISO(new Date(y, m - 1, 1)), fechaFin: this.toISO(new Date(y, m, 0)) };
      }
      case 'anual': {
        return { fechaInicio: `${this.selectedYear}-01-01`, fechaFin: `${this.selectedYear}-12-31` };
      }
    }
  }

  private toISO(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  get periodoLabel(): string {
    const { fechaInicio, fechaFin } = this.computeFechas();
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const ini   = new Date(fechaInicio + 'T12:00:00');
    const fin   = new Date(fechaFin   + 'T12:00:00');
    if (this.tipoPeriodo === 'anual') return String(this.selectedYear);
    if (this.tipoPeriodo === 'mensual') return `${meses[ini.getMonth()]} ${ini.getFullYear()}`;
    const mismoMes = ini.getMonth() === fin.getMonth() && ini.getFullYear() === fin.getFullYear();
    if (mismoMes) return `${ini.getDate()}–${fin.getDate()} ${meses[ini.getMonth()]} ${ini.getFullYear()}`;
    return `${ini.getDate()} ${meses[ini.getMonth()]} – ${fin.getDate()} ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
  }

  // ── Chart builders ────────────────────────────────────────────────────
  buildCharts(): void {
    if (!this.reporte) return;
    this.buildAreaChart();
    this.buildRadialChart();
    this.buildDonutMetodos();
    this.buildBarServicios();
    this.buildBarBarberos();
    this.buildChartsDetalle();
  }

  buildAreaChart(): void {
    const ventas = this.reporte!.ventas_por_dia;
    const gastos = this.reporte!.gastos_por_dia;
    let labels: string[], ingData: number[], gastoData: number[];

    if (this.tipoPeriodo === 'anual') {
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
    const metodos = this.reporte!.metodos_pago;
    const PALETTE = ['#fbc447','#dc3545','#28a745','#17a2b8','#6f42c1','#fd7e14'];
    this.donutMetodosOpts = metodos.length ? {
      series:      metodos.map((m: any) => Number(m.total)),
      chart:       { type: 'donut', height: 240, fontFamily: 'inherit', toolbar: { show: false } },
      labels:      metodos.map((m: any) => this.metodoPagoLabel(m.metodo_pago)),
      colors:      PALETTE,
      dataLabels:  { enabled: false },
      legend:      { position: 'bottom', fontSize: '11px' },
      tooltip:     { y: { formatter: (v: number) => this.formatCurrency(v) } },
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

  private buildChartsDetalle(): void {
    const d = this.reporte!;

    // ── Área: ingresos por día ─────────────────────────────────────────────
    const diasLabel = (d.ventas_por_dia || []).map((v: any) => this.fmtDia(v.dia));
    const diasData  = (d.ventas_por_dia || []).map((v: any) => Number(v.total));
    this.lineIngresosOpts = this.buildAreaDetalle('Ingresos', diasLabel, diasData, '#fbc447', '#1a1a2e');

    // ── Área: gastos por día ───────────────────────────────────────────────
    const diasGLabel = (d.gastos_por_dia || []).map((g: any) => this.fmtDia(g.dia));
    const diasGData  = (d.gastos_por_dia || []).map((g: any) => Number(g.total));
    this.lineGastosOpts = this.buildAreaDetalle('Gastos', diasGLabel, diasGData, '#ef4444', '#7f1d1d');

    // ── Bar: ingresos por hora (solo horas con datos, rangos 6–22) ─────────
    const horasMap: Record<number, number> = {};
    (d.ventas_por_hora || []).forEach((h: any) => { horasMap[h.hora] = Number(h.total); });
    const horasRange  = Array.from({ length: 17 }, (_, i) => i + 6);
    const horasLabels = horasRange.map(h => `${h}:00`);
    const horasData   = horasRange.map(h => horasMap[h] || 0);
    this.barHoraOpts = {
      series:      [{ name: 'Ingresos', data: horasData }],
      chart:       { type: 'bar', height: 240, toolbar: { show: false }, fontFamily: 'inherit', parentHeightOffset: 0 },
      xaxis:       { categories: horasLabels, axisBorder: { show: false }, axisTicks: { show: false },
                     labels: { style: { colors: '#9ca3af', fontSize: '10px' } } },
      yaxis:       { labels: { formatter: (v: number) => this.fmtShort(v), style: { colors: ['#9ca3af'], fontSize: '9px' } } },
      colors:      ['#fbc447'],
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%', distributed: false } },
      dataLabels:  { enabled: false },
      grid:        { borderColor: 'rgba(0,0,0,0.06)', strokeDashArray: 3, padding: { left: 0, right: 0 } },
      tooltip:     { y: { formatter: (v: number) => this.formatCurrency(v) }, style: { fontSize: '12px', fontFamily: 'inherit' } },
      fill:        { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.25, opacityFrom: 1, opacityTo: 0.7 } }
    };

    // ── Bar horizontal: top productos ──────────────────────────────────────
    const topP = ((d.top_productos || []) as any[]).slice(0, 7);
    this.barProductosOpts = topP.length ? {
      series:      [{ name: 'Unidades', data: topP.map((p: any) => Number(p.cantidad_vendida)) }],
      chart:       { type: 'bar', height: Math.max(220, topP.length * 34), toolbar: { show: false }, fontFamily: 'inherit', parentHeightOffset: 0 },
      xaxis:       { categories: topP.map((p: any) => p.nombre_producto),
                     labels: { style: { colors: '#9ca3af', fontSize: '11px' } }, axisBorder: { show: false } },
      yaxis:       { labels: { formatter: (v: number) => String(v) } },
      colors:      ['#f59e0b'],
      plotOptions: { bar: { borderRadius: 5, horizontal: true, barHeight: '60%' } },
      dataLabels:  { enabled: false },
      grid:        { borderColor: 'rgba(0,0,0,0.06)', strokeDashArray: 3, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip:     { y: { formatter: (v: number) => `${v} unidades` }, style: { fontSize: '12px' } }
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

    // ── Donut: créditos por estado ─────────────────────────────────────────
    const credEst = (d.creditos?.estadisticas || []) as any[];
    this.donutCreditosOpts = credEst.length ? {
      series:      credEst.map((c: any) => Number(c.cantidad)),
      chart:       { type: 'donut', height: 280, fontFamily: 'inherit' },
      labels:      credEst.map((c: any) => c.estado.charAt(0).toUpperCase() + c.estado.slice(1)),
      colors:      ['#f59e0b','#3b82f6','#10b981','#ef4444','#6b7280'],
      dataLabels:  { enabled: true,
        formatter: (_val: number, opts: any) => `${Math.round(opts.w.globals.seriesPercent[opts.seriesIndex])}%`,
        style: { fontSize: '11px', fontFamily: 'inherit', fontWeight: 700 }, dropShadow: { enabled: false }
      },
      legend:      { position: 'bottom', fontSize: '12px', fontFamily: 'inherit', markers: { width: 9, height: 9, radius: 3 } },
      tooltip:     { y: { formatter: (v: number) => `${v} créditos` }, style: { fontSize: '12px' } },
      plotOptions: { pie: { donut: { size: '60%',
        labels: { show: true, total: { show: true, label: 'Total cred.', fontSize: '11px', color: '#1a1a2e',
          formatter: (w: any) => String(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)) } } } } },
      stroke: { width: 2, colors: ['#fff'] }
    } : null;

    // ── Donut: gastos por categoría ────────────────────────────────────────
    const gastosCat = (d.gastos_por_categoria || []) as any[];
    this.donutGastosOpts = gastosCat.length ? {
      series:      gastosCat.map((g: any) => Number(g.total)),
      chart:       { type: 'donut', height: 280, fontFamily: 'inherit' },
      labels:      gastosCat.map((g: any) => g.categoria),
      colors:      ['#ef4444','#f97316','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16'],
      dataLabels:  { enabled: true,
        formatter: (_val: number, opts: any) => `${Math.round(opts.w.globals.seriesPercent[opts.seriesIndex])}%`,
        style: { fontSize: '11px', fontFamily: 'inherit', fontWeight: 700 }, dropShadow: { enabled: false }
      },
      legend:      { position: 'bottom', fontSize: '12px', fontFamily: 'inherit', markers: { width: 9, height: 9, radius: 3 } },
      tooltip:     { y: { formatter: (v: number) => this.formatCurrency(v) }, style: { fontSize: '12px' } },
      plotOptions: { pie: { donut: { size: '62%',
        labels: { show: true, total: { show: true, label: 'Total gastos', fontSize: '11px', color: '#1a1a2e',
          formatter: (w: any) => this.fmtShort(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)) } } } } },
      stroke: { width: 2, colors: ['#fff'] }
    } : null;

    // ── Bar horizontal: top clientes ───────────────────────────────────────
    const topC = ((d.top_clientes || []) as any[]).slice(0, 8);
    this.barClientesOpts = topC.length ? {
      series:      [{ name: 'Total gastado', data: topC.map((c: any) => Number(c.total_gastado)) }],
      chart:       { type: 'bar', height: Math.max(240, topC.length * 38), toolbar: { show: false }, fontFamily: 'inherit', parentHeightOffset: 0 },
      xaxis:       { categories: topC.map((c: any) => c.cliente),
                     labels: { style: { colors: '#9ca3af', fontSize: '11px' } }, axisBorder: { show: false } },
      yaxis:       { labels: { formatter: (v: number) => this.fmtShort(v), style: { colors: ['#9ca3af'], fontSize: '9px' } } },
      colors:      ['#8b5cf6'],
      plotOptions: { bar: { borderRadius: 5, horizontal: true, barHeight: '55%' } },
      dataLabels:  { enabled: false },
      grid:        { borderColor: 'rgba(0,0,0,0.06)', strokeDashArray: 3, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip:     { y: { formatter: (v: number) => this.formatCurrency(v) }, style: { fontSize: '12px', fontFamily: 'inherit' } }
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
    const { fechaInicio, fechaFin } = this.computeFechas();
    this.descargando = true;
    this.reporteService.descargarPDF({ fechaInicio, fechaFin }).subscribe({
      next:  blob => { this.triggerDownload(blob, `reporte_${fechaInicio}_${fechaFin}.pdf`); this.descargando = false; },
      error: ()   => { this.toast.error('Error al generar PDF'); this.descargando = false; }
    });
  }

  exportarExcel(): void {
    const { fechaInicio, fechaFin } = this.computeFechas();
    this.descargando = true;
    this.reporteService.descargarExcel({ fechaInicio, fechaFin }).subscribe({
      next:  blob => { this.triggerDownload(blob, `reporte_${fechaInicio}_${fechaFin}.xlsx`); this.descargando = false; },
      error: ()   => { this.toast.error('Error al generar Excel'); this.descargando = false; }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  compartirWhatsApp(): void {
    if (!this.kpis) return;
    const { fechaInicio, fechaFin } = this.computeFechas();
    const k = this.kpis;
    const texto = [
      `*Reporte Barbería — ${this.periodoLabel}*`,
      `📅 ${fechaInicio} al ${fechaFin}`,
      ``,
      `💰 Ingresos: ${this.formatCurrency(k.ingresos_total)}`,
      `💸 Gastos: ${this.formatCurrency(k.total_gastos)}`,
      `📊 Ganancia neta: ${this.formatCurrency(k.ganancia_neta)}`,
      `✂️ Reservas: ${k.reservas_total} (${k.reservas_completadas} completadas)`,
      `🧔 Comisiones: ${this.formatCurrency(k.total_comisiones_barbero)}`,
      `👥 Clientes nuevos: ${k.clientes_nuevos}`,
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  }

  // ── Modal detalle reserva ─────────────────────────────────────────────
  abrirDetalleReserva(r: any): void { this.reservaDetalle = r; }
  cerrarDetalleReserva(): void      { this.reservaDetalle = null; }

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
