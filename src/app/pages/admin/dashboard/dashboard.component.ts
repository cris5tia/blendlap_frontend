import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  cargando = true;
  data: any = null;
  error = '';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.dashboardService.getResumenAdmin().subscribe({
      next: (res) => {
        this.data = res.data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar el dashboard';
        this.cargando = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  getMesNombre(mesStr: string): string {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const mes = parseInt(mesStr.split('-')[1]) - 1;
    return meses[mes];
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'completada': return 'badge-success';
      case 'pendiente': return 'badge-warning';
      case 'cancelada': return 'badge-danger';
      case 'confirmada': return 'badge-info';
      default: return 'badge-default';
    }
  }

  get maxIngreso(): number {
    if (!this.data?.ingresosMeses?.length) return 1;
    return Math.max(...this.data.ingresosMeses.map((m: any) => Number(m.ingresos)));
  }

  get ingresosMesesConGastos(): any[] {
    if (!this.data?.ingresosMeses) return [];
    return this.data.ingresosMeses.map((m: any) => {
      const gastoMes = this.data.gastosMeses?.find((g: any) => g.mes === m.mes);
      return {
        ...m,
        gastos: gastoMes ? Number(gastoMes.total_gastos) : 0,
        ganancia_neta: Number(m.ganancia_bruta) - (gastoMes ? Number(gastoMes.total_gastos) : 0)
      };
    });
  }
}