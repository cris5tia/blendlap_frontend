import { Component, OnInit } from '@angular/core';
import { VentaService, IVenta, ICierreCaja } from '../../../core/services/venta.service';

@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.scss']
})
export class VentasComponent implements OnInit {

  ventas: IVenta[] = [];
  ventasFiltradas: IVenta[] = [];
  ventaDetalle: IVenta | null = null;
  cierreCaja: ICierreCaja | null = null;

  cargando = true;
  cargandoCierre = false;
  error = '';

  filtroFecha = '';
  filtroMetodo = '';
  busqueda = '';

  fechaCierre = new Date().toISOString().split('T')[0];
  mostrarCierre = false;
  mostrarDetalle = false;

  metodos = ['efectivo', 'tarjeta', 'transferencia', 'nequi', 'otro'];

  constructor(private ventaService: VentaService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.ventaService.getAll().subscribe({
      next: (res) => {
        this.ventas = res.data;
        this.filtrar();
        this.cargando = false;
      },
      error: () => { this.error = 'Error al cargar ventas'; this.cargando = false; }
    });
  }

  filtrar(): void {
    let lista = [...this.ventas];
    if (this.filtroFecha)  lista = lista.filter(v => v.fecha?.startsWith(this.filtroFecha));
    if (this.filtroMetodo) lista = lista.filter(v => v.metodo_pago === this.filtroMetodo);
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(v => v.nombre_cajero?.toLowerCase().includes(q) || String(v.id_venta).includes(q));
    }
    this.ventasFiltradas = lista;
  }

  verDetalle(id: number): void {
    this.ventaDetalle = null;
    this.mostrarDetalle = true;
    this.ventaService.getById(id).subscribe({
      next: (res) => this.ventaDetalle = res.data,
      error: () => this.error = 'Error al cargar detalle'
    });
  }

  cargarCierreCaja(): void {
    this.cargandoCierre = true;
    this.cierreCaja = null;
    this.ventaService.cierreCaja(this.fechaCierre).subscribe({
      next: (res) => { this.cierreCaja = res.data; this.cargandoCierre = false; },
      error: () => { this.error = 'Error al cargar cierre de caja'; this.cargandoCierre = false; }
    });
  }

  get totalFiltrado(): number {
    return this.ventasFiltradas.reduce((sum, v) => sum + Number(v.total), 0);
  }

  metodoPagoLabel(m: string): string {
    const map: any = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', nequi: 'Nequi', otro: 'Otro' };
    return map[m] || m;
  }

  metodoBadgeClass(m: string): string {
    const map: any = { efectivo: 'badge-success', tarjeta: 'badge-info', transferencia: 'badge-warning', nequi: 'badge-nequi', otro: 'badge-default' };
    return map[m] || 'badge-default';
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);
  }

  cerrarModal(): void { this.mostrarDetalle = false; this.mostrarCierre = false; this.ventaDetalle = null; }
}