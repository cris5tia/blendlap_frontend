import { Component, OnInit } from '@angular/core';
import { GastoService, IGasto, IEstadisticasGasto } from '../../../core/services/gasto.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexLegend,
  ApexDataLabels, ApexTooltip, ApexPlotOptions, ApexFill, ApexStroke,
  ApexAxisChartSeries, ApexXAxis, ApexYAxis, ApexGrid, ApexTitleSubtitle
} from 'ng-apexcharts';

export type DonutChartOptions = {
  series:      ApexNonAxisChartSeries;
  chart:       ApexChart;
  labels:      string[];
  colors:      string[];
  legend:      ApexLegend;
  dataLabels:  ApexDataLabels;
  tooltip:     ApexTooltip;
  plotOptions: ApexPlotOptions;
  stroke:      ApexStroke;
  fill:        ApexFill;
};

export type BarChartOptions = {
  series:     ApexAxisChartSeries;
  chart:      ApexChart;
  xaxis:      ApexXAxis;
  yaxis:      ApexYAxis;
  colors:     string[];
  grid:       ApexGrid;
  dataLabels: ApexDataLabels;
  tooltip:    ApexTooltip;
  plotOptions: ApexPlotOptions;
  fill:       ApexFill;
  stroke:     ApexStroke;
};

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.scss']
})
export class GastosComponent implements OnInit {

  modalTodos = false;
  categoriaOpen = false;
  categoriaFiltroOpen = false;

  stats: IEstadisticasGasto | null = null;
  cargandoStats = false;

  gastos:   IGasto[] = [];
  cargando  = false;
  error     = '';
  guardando = false;

  filtros = { desde: '', hasta: '', categoria: '' };

  modalVisible  = false;
  editando      = false;
  formulario:   IGasto = this.formularioVacio();

  modalEliminar     = false;
  gastoAEliminar:   IGasto | null = null;
  eliminando        = false;

  categorias = [
    'Arriendo', 'Servicios públicos', 'Internet', 'Productos',
    'Mantenimiento', 'Nómina', 'Marketing', 'Equipos', 'Otros'
  ];

  coloresCat: { [key: string]: string } = {
    'Arriendo':           '#FBC447',
    'Servicios públicos': '#3b82f6',
    'Internet':           '#8b5cf6',
    'Productos':          '#22c55e',
    'Mantenimiento':      '#f59e0b',
    'Nómina':             '#ef4444',
    'Marketing':          '#ec4899',
    'Equipos':            '#14b8a6',
    'Otros':              '#9e9e9e'
  };

  // ─── Donut ────────────────────────────────────────────────
  donutOptions: Partial<DonutChartOptions> = {};
  donutListo = false;

  // ─── Barras ───────────────────────────────────────────────
  barOptions: Partial<BarChartOptions> = {};
  barListo = false;

  constructor(
    private gastoService: GastoService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarStats();
    this.cargarGastos();
  }

  cargarStats(): void {
    this.cargandoStats = true;
    this.donutListo    = false;
    this.barListo      = false;

    this.gastoService.getEstadisticas({
      desde: this.filtros.desde,
      hasta: this.filtros.hasta
    }).subscribe({
      next: (res) => {
        this.stats = res.data;
        this.cargandoStats = false;
        this.construirDonut();
        this.construirBarras();
      },
      error: () => this.cargandoStats = false
    });
  }

  // ─── Construir Donut ──────────────────────────────────────
  construirDonut(): void {
    if (!this.stats?.por_categoria?.length) return;

    const cats    = this.stats.por_categoria;
    const labels  = cats.map(c => c.categoria);
    const series  = cats.map(c => Number(c.total));
    const colors  = labels.map(l => this.coloresCat[l] || '#9e9e9e');

    this.donutOptions = {
      series,
      chart: {
        type: 'donut',
        height: 340,
        fontFamily: 'Montserrat, sans-serif',
        toolbar: { show: false },
        animations: {
          enabled: true,
          speed: 600,
          animateGradually: { enabled: true, delay: 80 }
        }
      },
      labels,
      colors,
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                fontSize: '13px',
                fontWeight: '700',
                color: '#1a1a1a',
                formatter: (w) => {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return new Intl.NumberFormat('es-CO', {
                    style: 'currency', currency: 'COP', minimumFractionDigits: 0
                  }).format(total);
                }
              },
              value: {
                show: true,
                fontSize: '16px',
                fontWeight: '800',
                color: '#1a1a1a',
                formatter: (val) => new Intl.NumberFormat('es-CO', {
                  style: 'currency', currency: 'COP', minimumFractionDigits: 0
                }).format(Number(val))
              }
            }
          }
        }
      },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: 'bottom',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'Montserrat, sans-serif',
        markers: { width: 10, height: 10, radius: 10 },
        itemMargin: { horizontal: 8, vertical: 4 }
      },
      tooltip: {
        y: {
          formatter: (val) => new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP', minimumFractionDigits: 0
          }).format(val)
        }
      },
      stroke: { width: 2, colors: ['#fff'] },
      fill:   { type: 'solid' }
    };

    this.donutListo = true;
  }

  // ─── Construir Barras ─────────────────────────────────────
  construirBarras(): void {
  if (!this.stats?.evolucion?.length) return;

  const evol    = this.stats.evolucion;
  const cats    = evol.map(e => e.dia);
  const valores = evol.map(e => Number(e.total));

  this.barOptions = {
    series: [{ name: 'Gastos', data: valores }],
    chart: {
      type: 'area',
      height: 280,
      fontFamily: 'Montserrat, sans-serif',
      toolbar: { show: false },
      animations: {
        enabled: true,
        speed: 600,
        animateGradually: { enabled: true, delay: 60 }
      }
    },
    plotOptions: {},
    colors: ['#FBC447'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.4,
        gradientToColors: ['#ffffff'],
        opacityFrom: 0.6,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    stroke: {
      show: true,
      width: 3,
      curve: 'smooth',
      colors: ['#FBC447']
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: cats,
      labels: {
        style: {
          fontSize: '11px',
          fontFamily: 'Montserrat, sans-serif',
          colors: '#9e9e9e'
        },
        rotate: -30
      },
      axisBorder: { show: false },
      axisTicks:  { show: false }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '11px',
          fontFamily: 'Montserrat, sans-serif',
          colors: '#9e9e9e'
        },
        formatter: (val) => {
          if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
          if (val >= 1000)    return '$' + (val / 1000).toFixed(0) + 'K';
          return '$' + val;
        }
      }
    },
    grid: {
      borderColor: '#f3f4f6',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true  } }
    },
    tooltip: {
      y: {
        formatter: (val) => new Intl.NumberFormat('es-CO', {
          style: 'currency', currency: 'COP', minimumFractionDigits: 0
        }).format(val)
      }
    }
  };

  this.barListo = true;
}

  cargarGastos(): void {
    this.cargando = true;
    this.gastoService.getAll(this.filtros).subscribe({
      next: (res) => { this.gastos = res.data; this.cargando = false; },
      error: () => { this.toastService.error('Error al cargar gastos'); this.cargando = false; }
    });
  }

  aplicarFiltros(): void {
    this.cargarStats();
    this.cargarGastos();
  }

  limpiarFiltros(): void {
    this.filtros = { desde: '', hasta: '', categoria: '' };
    this.aplicarFiltros();
  }

  getColor(categoria: string): string {
    return this.coloresCat[categoria] || '#9e9e9e';
  }

  getPorcentaje(total: number): number {
    if (!this.stats?.total) return 0;
    return Math.round((total / this.stats.total) * 100);
  }

  abrirModal(gasto?: IGasto): void {
    this.editando     = !!gasto;
    this.formulario   = gasto ? { ...gasto } : this.formularioVacio();
    this.modalVisible = true;
    this.error        = '';
  }

  cerrarModal(): void { this.modalVisible = false; this.categoriaOpen = false; }

  guardar(): void {
    if (!this.formulario.nombre || !this.formulario.categoria ||
        !this.formulario.monto  || !this.formulario.fecha) {
      this.error = 'Completa todos los campos requeridos';
      return;
    }
    this.guardando = true;
    this.error     = '';

    if (this.editando && this.formulario.id_gasto) {
      const { id_gasto, ...data } = this.formulario;
      this.gastoService.actualizar(id_gasto, data).subscribe({
        next: () => { this.guardando = false; this.cerrarModal(); this.aplicarFiltros(); },
        error: () => { this.error = 'Error al actualizar'; this.guardando = false; }
      });
    } else {
      this.gastoService.crear(this.formulario).subscribe({
        next: () => { this.guardando = false; this.cerrarModal(); this.aplicarFiltros(); },
        error: () => { this.error = 'Error al crear'; this.guardando = false; }
      });
    }
  }

  confirmarEliminar(gasto: IGasto): void {
    this.gastoAEliminar = gasto;
    this.modalEliminar  = true;
  }

  eliminar(): void {
    if (!this.gastoAEliminar?.id_gasto) return;
    this.eliminando = true;
    this.gastoService.eliminar(this.gastoAEliminar.id_gasto).subscribe({
      next: () => {
        this.gastos         = this.gastos.filter(g => g.id_gasto !== this.gastoAEliminar!.id_gasto);
        this.eliminando     = false;
        this.modalEliminar  = false;
        this.gastoAEliminar = null;
        this.cargarStats();
      },
      error: () => { this.toastService.error('Error al eliminar'); this.eliminando = false; }
    });
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v || 0);
  }

  private formularioVacio(): IGasto {
    return {
      nombre: '', categoria: '', monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: ''
    };
  }
}