import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis,
  ApexStroke, ApexFill, ApexTooltip, ApexGrid, ApexMarkers,
  ApexPlotOptions, ApexDataLabels, ApexLegend, ApexResponsive
} from 'ng-apexcharts';

export type ChartAreaOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  stroke: ApexStroke;
  fill: ApexFill;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  markers: ApexMarkers;
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
};

export type ChartRadialOptions = {
  series: number[];
  chart: ApexChart;
  labels: string[];
  colors: string[];
  plotOptions: ApexPlotOptions;
  stroke: ApexStroke;
  fill: ApexFill;
  legend: ApexLegend;
  responsive: ApexResponsive[];
  dataLabels: ApexDataLabels;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  cargando = true;
  data: any = null;
  error = '';

  chartAreaOptions!: Partial<ChartAreaOptions>;
  chartRadialOptions!: Partial<ChartRadialOptions>;

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void { this.cargarDatos(); }

  cargarDatos(): void {
    this.cargando = true;
    this.dashboardService.getResumenAdmin().subscribe({
      next: (res) => {
        this.data = res.data;
        this.cargando = false;
        this.iniciarGraficas();
      },
      error: () => { this.error = 'Error al cargar el dashboard'; this.cargando = false; }
    });
  }

  iniciarGraficas(): void {
    this.buildAreaChart();
    this.buildRadialChart();
  }

  buildAreaChart(): void {
    const meses = this.ingresosMesesConGastos;
    const labels = meses.length ? meses.map((m: any) => this.getMesNombre(m.mes)) : ['Este mes'];
    const ingresos = meses.length ? meses.map((m: any) => m.ingresos) : [this.data.ingresosMes || 0];
    const gastos = meses.length ? meses.map((m: any) => m.gastos) : [this.data.gastosMes || 0];
    const neta = meses.length ? meses.map((m: any) => m.ganancia_neta) : [this.data.gananciaNeta || 0];

    this.chartAreaOptions = {
      series: [
        { name: 'Ingresos', type: 'bar', data: ingresos },
        { name: 'Gastos', type: 'bar', data: gastos },
        { name: 'Ganancia neta', type: 'line', data: neta }
      ],
      chart: {
        type: 'bar', height: 260,
        toolbar: { show: false },
        background: 'transparent',
        fontFamily: 'inherit',
        animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 100 } }
      },
      colors: ['#fbc447', '#dc3545', '#28a745'],
      plotOptions: {
        bar: { columnWidth: '55%', borderRadius: 5, borderRadiusApplication: 'end' }
      },
      stroke: { width: [0, 0, 3], curve: 'smooth', dashArray: [0, 0, 0] },
      markers: { size: [0, 0, 5], strokeWidth: 2, strokeColors: '#fff', hover: { size: 7 } },
      dataLabels: { enabled: false },
      fill: { type: ['solid', 'solid', 'solid'], opacity: [0.88, 0.88, 1] },
      xaxis: {
        categories: labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#adb5bd', fontSize: '11px' } }
      },
      yaxis: [
        {
          seriesName: 'Ingresos',
          labels: {
            style: { colors: '#adb5bd', fontSize: '10px' },
            formatter: (v: number) => this.formatCurrencyShort(v)
          },
          min: 0
        },
        {
          seriesName: 'Gastos',
          show: false,
          min: 0
        },
        {
          seriesName: 'Ganancia neta',
          opposite: true,
          labels: {
            style: { colors: '#28a745', fontSize: '10px' },
            formatter: (v: number) => this.formatCurrencyShort(v)
          }
        }
      ],
      grid: { borderColor: 'rgba(0,0,0,0.05)', strokeDashArray: 4, padding: { left: 4, right: 4 } },
      tooltip: {
        theme: 'light',
        shared: true,
        intersect: false,
        y: { formatter: (v: number) => this.formatCurrency(v) }
      },
      legend: { show: false }
    };
  }

  buildRadialChart(): void {
    const ingresos = this.data.ingresosMes || 0;
    const gastos = this.data.gastosMes || 0;
    const neta = this.data.gananciaNeta || 0;
    const max = ingresos || 1;

    const pGastos = Math.round((gastos / max) * 100);
    const pNeta = neta >= 0 ? Math.round((neta / max) * 100) : 0;
    const margen = ingresos > 0 ? Math.round((neta / ingresos) * 100) : 0;

    this.chartRadialOptions = {
      series: [100, pGastos, pNeta],
      chart: {
        type: 'radialBar', height: 300,
        toolbar: { show: false },
        background: 'transparent',
        fontFamily: 'inherit',
        animations: { enabled: true, speed: 800 }
      },
      labels: ['Ingresos', 'Gastos', 'Ganancia neta'],
      colors: ['#fbc447', '#dc3545', '#28a745'],
      plotOptions: {
        radialBar: {
          hollow: { size: '28%', background: 'transparent' },
          track: { background: 'rgba(0,0,0,0.05)', strokeWidth: '100%', margin: 6 },
          dataLabels: {
            show: true,
            name: { fontSize: '12px', color: '#adb5bd', offsetY: -4 },
            value: {
              fontSize: '15px', fontWeight: 700, color: '#1a1a1a', offsetY: 4,
              formatter: (v: number) => v + '%'
            },
            total: {
              show: true, label: 'Margen neto',
              fontSize: '11px', color: '#adb5bd',
              formatter: () => margen + '%'
            }
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(value || 0);
  }

  formatCurrencyShort(value: number): string {
    if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
    return '$' + value;
  }

  getMesNombre(mesStr: string): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[parseInt(mesStr.split('-')[1]) - 1];
  }

  getEstadoClass(estado: string): string {
    const map: any = { completada: 'badge-success', pendiente: 'badge-warning', cancelada: 'badge-danger', confirmada: 'badge-info' };
    return map[estado] || 'badge-default';
  }

  get ingresosMesesConGastos(): any[] {
    if (!this.data?.ingresosMeses) return [];

    const ahora = new Date();
    const mesesValidos: string[] = [];

    for (let i = 2; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      mesesValidos.push(key);
    }

    return this.data.ingresosMeses
      .filter((m: any) => mesesValidos.includes(m.mes))
      .map((m: any) => {
        const gastoMes = this.data.gastosMeses?.find((g: any) => g.mes === m.mes);
        const gastos = gastoMes ? Number(gastoMes.total_gastos) : 0;
        return {
          ...m,
          ingresos: Number(m.ingresos),
          gastos,
          ganancia_neta: Number(m.ganancia_bruta) - gastos
        };
      });
  }

  get maxCitasBarbero(): number {
    if (!this.data?.rankingBarberos?.length) return 1;
    return Math.max(...this.data.rankingBarberos.map((b: any) => b.total_citas)) || 1;
  }

  porcentajeCitas(citas: number): number {
    return Math.round((citas / this.maxCitasBarbero) * 100);
  }
}