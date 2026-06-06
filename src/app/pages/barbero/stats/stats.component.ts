import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { StatsService, IStatsBarbero } from '../../../core/services/stats.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit, OnDestroy {

  @ViewChild('chartDiario')   chartDiarioRef!: ElementRef;
  @ViewChild('chartClientes') chartClientesRef!: ElementRef;
  @ViewChild('chartPie')      chartPieRef!: ElementRef;

  usuario: any = null;
  stats: IStatsBarbero | null = null;
  cargando = false;
  error = '';

  mesActualLabel = '';

  private chartDiario:   Chart | null = null;
  private chartClientes: Chart | null = null;
  private chartPie:      Chart | null = null;

  constructor(
    private authService: AuthService,
    private statsService: StatsService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    const ahora = new Date();
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    this.mesActualLabel = `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;
    this.cargarStats();
  }

  ngOnDestroy(): void {
    this.chartDiario?.destroy();
    this.chartClientes?.destroy();
    this.chartPie?.destroy();
  }

  cargarStats(): void {
    this.cargando = true;
    this.statsService.getStatsBarbero().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.cargando = false;
        setTimeout(() => this.iniciarGraficas(), 120);
      },
      error: () => {
        this.error = 'Error al cargar estadísticas';
        this.cargando = false;
      }
    });
  }

  private iniciarGraficas(): void {
    if (!this.stats) return;
    if ((this.stats.citasPorDiaMes?.length ?? 0) > 0)  this.crearGraficaDiaria();
    if ((this.stats.topClientes?.length ?? 0) > 0)      this.crearGraficaClientes();
    if (this.stats.distribucionServicios.length > 0)     this.crearGraficaPie();
  }

  private makeGradient(canvas: HTMLCanvasElement, top: string, bot: string): CanvasGradient {
    const ctx = canvas.getContext('2d')!;
    const g   = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight || 280);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    return g;
  }

  private fillDias(raw: { dia: number; citas: number; ingresos: number }[]) {
    const hoy = new Date().getDate();
    return Array.from({ length: hoy }, (_, i) => {
      const d = i + 1;
      const f = raw.find(r => +r.dia === d);
      return { dia: d, citas: f ? +f.citas : 0, ingresos: f ? +f.ingresos : 0 };
    });
  }

  private crearGraficaDiaria(): void {
    if (!this.chartDiarioRef) return;
    this.chartDiario?.destroy();

    const canvas = this.chartDiarioRef.nativeElement as HTMLCanvasElement;
    const dias   = this.fillDias(this.stats!.citasPorDiaMes ?? []);
    const labels = dias.map(d => `${d.dia}`);

    const gradGold = this.makeGradient(canvas, 'rgba(251,196,71,0.28)', 'rgba(251,196,71,0)');
    const gradDark = this.makeGradient(canvas, 'rgba(26,26,26,0.14)',   'rgba(26,26,26,0)');

    const tooltipBase = {
      backgroundColor: '#1a1a1a',
      titleColor: '#fbc447',
      bodyColor: '#e8e8e8',
      borderColor: 'rgba(251,196,71,0.2)',
      borderWidth: 1,
      padding: 14,
      displayColors: true,
      boxPadding: 4
    };

    this.chartDiario = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: dias.map(d => d.ingresos),
            borderColor: '#fbc447',
            borderWidth: 2.5,
            backgroundColor: gradGold,
            fill: true,
            tension: 0.45,
            yAxisID: 'yIngresos',
            pointRadius: dias.length > 15 ? 3 : 5,
            pointBackgroundColor: '#fbc447',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 7
          },
          {
            label: 'Citas',
            data: dias.map(d => d.citas),
            borderColor: '#1a1a1a',
            borderWidth: 2,
            backgroundColor: gradDark,
            fill: true,
            tension: 0.45,
            yAxisID: 'yCitas',
            pointRadius: dias.length > 15 ? 3 : 5,
            pointBackgroundColor: '#1a1a1a',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              font: { size: 11 }, color: '#666',
              usePointStyle: true, pointStyleWidth: 8, boxHeight: 8, padding: 16
            }
          },
          tooltip: {
            ...tooltipBase,
            callbacks: {
              title: (items) => `Día ${items[0].label}`,
              label: (ctx) => {
                if (ctx.datasetIndex === 0) return ` ${this.formatPeso(ctx.raw as number)}`;
                return ` ${ctx.raw} citas`;
              }
            }
          }
        },
        scales: {
          yIngresos: {
            type: 'linear', position: 'left',
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.04)' },
            border: { display: false, dash: [4, 4] },
            ticks: {
              color: '#bbb', font: { size: 10 }, padding: 8,
              callback: (v) => {
                const n = v as number;
                if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`;
                if (n >= 1_000)     return `$${(n/1_000).toFixed(0)}K`;
                return `$${n}`;
              }
            }
          },
          yCitas: {
            type: 'linear', position: 'right',
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            border: { display: false },
            ticks: { color: '#bbb', font: { size: 10 }, padding: 8, stepSize: 1 }
          },
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#bbb', font: { size: 10 }, padding: 6, maxTicksLimit: 16 }
          }
        }
      }
    });
  }

  private crearGraficaClientes(): void {
    if (!this.chartClientesRef) return;
    this.chartClientes?.destroy();

    const clientes = this.stats!.topClientes;
    const labels   = clientes.map(c => c.nombre_cliente);
    const citas    = clientes.map(c => c.citas);

    this.chartClientes = new Chart(this.chartClientesRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Citas',
          data: citas,
          backgroundColor: 'rgba(251,196,71,0.85)',
          borderColor: '#fbc447',
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a', titleColor: '#fbc447',
            bodyColor: '#e8e8e8', borderColor: 'rgba(251,196,71,0.2)',
            borderWidth: 1, padding: 12, displayColors: false,
            callbacks: {
              label: (ctx) => {
                const c = clientes[ctx.dataIndex];
                return [` ${c.citas} citas`, ` ${this.formatPeso(c.ingresos)}`];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.04)' },
            border: { display: false },
            ticks: { color: '#bbb', font: { size: 10 }, stepSize: 1 }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#444', font: { size: 11, weight: 'bold' } }
          }
        }
      }
    });
  }

  private crearGraficaPie(): void {
    if (!this.chartPieRef) return;
    this.chartPie?.destroy();

    const servicios = this.stats!.distribucionServicios;
    const colores   = ['#fbc447','#1a1a1a','#e0a800','#555','#c8a020','#888','#d4a017','#333'];

    this.chartPie = new Chart(this.chartPieRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: servicios.map(s => s.nombre_servicio),
        datasets: [{
          data: servicios.map(s => s.total),
          backgroundColor: colores,
          borderWidth: 3,
          borderColor: '#fff',
          hoverBorderWidth: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11 }, color: '#666', padding: 14, usePointStyle: true, pointStyleWidth: 8, boxHeight: 8 }
          },
          tooltip: {
            backgroundColor: '#1a1a1a', titleColor: '#fbc447',
            bodyColor: '#e8e8e8', borderColor: 'rgba(251,196,71,0.2)',
            borderWidth: 1, padding: 12, displayColors: false,
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + (b as number), 0);
                const pct   = ((ctx.raw as number / total) * 100).toFixed(0);
                return ` ${ctx.raw} cortes · ${pct}%`;
              }
            }
          }
        }
      }
    });
  }

  formatPeso(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(valor);
  }
}
