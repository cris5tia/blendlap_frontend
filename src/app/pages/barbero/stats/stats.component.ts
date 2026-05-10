import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { StatsService, IStatsBarbero } from '../../../core/services/stats.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit, AfterViewInit {

  @ViewChild('chartBarras') chartBarrasRef!: ElementRef;
  @ViewChild('chartPie') chartPieRef!: ElementRef;

  usuario: any = null;
  stats: IStatsBarbero | null = null;
  cargando = false;
  error = '';

  chartBarras: Chart | null = null;
  chartPie: Chart | null = null;

  constructor(
    private authService: AuthService,
    private statsService: StatsService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarStats();
  }

  ngAfterViewInit(): void {}

  cargarStats(): void {
    this.cargando = true;
    this.statsService.getStatsBarbero().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.cargando = false;
        setTimeout(() => this.iniciarGraficas(), 100);
      },
      error: () => {
        this.error = 'Error al cargar estadisticas';
        this.cargando = false;
      }
    });
  }

  iniciarGraficas(): void {
    if (!this.stats) return;
    this.crearGraficaBarras();
    this.crearGraficaPie();
  }

  crearGraficaBarras(): void {
    if (!this.chartBarrasRef) return;
    if (this.chartBarras) this.chartBarras.destroy();

    const meses = this.stats!.ultimos6Meses;
    const labels = meses.map(m => this.formatMes(m.mes));
    const citas = meses.map(m => m.citas);
    const ingresos = meses.map(m => m.ingresos / 1000);

    this.chartBarras = new Chart(this.chartBarrasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Citas',
            data: citas,
            backgroundColor: 'rgba(251,196,71,0.85)',
            borderColor: '#fbc447',
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Ingresos (miles)',
            data: ingresos,
            backgroundColor: 'rgba(26,26,26,0.75)',
            borderColor: '#1a1a1a',
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { size: 12, family: 'Inter' },
              color: '#555',
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 8
            }
          },
          tooltip: {
            backgroundColor: '#1a1a1a',
            titleColor: '#fbc447',
            bodyColor: '#fff',
            padding: 12,
            callbacks: {
              label: (ctx) => {
                if (ctx.datasetIndex === 1) return ` $${(ctx.raw as number * 1000).toLocaleString('es-CO')}`;
                return ` ${ctx.raw} citas`;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#999', font: { size: 11 } }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#999', font: { size: 11 },
              callback: (val) => `$${val}k`
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#999', font: { size: 11 } }
          }
        }
      }
    });
  }

  crearGraficaPie(): void {
    if (!this.chartPieRef) return;
    if (this.chartPie) this.chartPie.destroy();

    const servicios = this.stats!.distribucionServicios;
    if (servicios.length === 0) return;

    const colores = ['#fbc447','#1a1a1a','#888','#c8a020','#444'];

    this.chartPie = new Chart(this.chartPieRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: servicios.map(s => s.nombre_servicio),
        datasets: [{
          data: servicios.map(s => s.total),
          backgroundColor: colores,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 11, family: 'Inter' },
              color: '#555',
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 8
            }
          },
          tooltip: {
            backgroundColor: '#1a1a1a',
            titleColor: '#fbc447',
            bodyColor: '#fff',
            padding: 12,
            callbacks: {
              label: (ctx) => ` ${ctx.raw} cortes`
            }
          }
        }
      }
    });
  }

  formatMes(mes: string): string {
    const [año, m] = mes.split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${meses[parseInt(m)-1]} ${año.slice(2)}`;
  }

  formatPeso(valor: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);
  }
}