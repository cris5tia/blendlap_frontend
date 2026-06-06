import { Component, OnInit } from '@angular/core';
import { ClienteService, ICliente } from '../../../core/services/cliente.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent implements OnInit {

  clientes: ICliente[] = [];
  clientesFiltrados: ICliente[] = [];
  cargando = false;
  busqueda = '';

  modalHistorial = false;
  clienteSeleccionado: ICliente | null = null;
  historial: any = null;
  cargandoHistorial = false;

  constructor(
    private clienteService: ClienteService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargando = true;
    this.clienteService.getAll().subscribe({
      next: (res) => {
        this.clientes = res.data;
        this.clientesFiltrados = this.aplicarOrden(res.data);
        this.cargando = false;
      },
      error: () => { this.toastService.error('Error al cargar clientes'); this.cargando = false; }
    });
  }

  buscar(): void {
    const t = this.busqueda.trim();
    if (!t) { this.clientesFiltrados = this.aplicarOrden(this.clientes); return; }
    this.clienteService.buscar(t).subscribe({
      next: (res) => this.clientesFiltrados = this.aplicarOrden(res.data),
      error: () => {}
    });
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.clientesFiltrados = this.aplicarOrden(this.clientes);
  }

  private aplicarOrden(lista: ICliente[]): ICliente[] {
    return [...lista].sort((a, b) => b.total_cortes - a.total_cortes);
  }

  abrirHistorial(cliente: ICliente): void {
    this.clienteSeleccionado = cliente;
    this.historial = null;
    this.cargandoHistorial = true;
    this.modalHistorial = true;
    this.clienteService.getHistorial(cliente.id_usuario).subscribe({
      next: (res) => { this.historial = res.data; this.cargandoHistorial = false; },
      error: () => this.cargandoHistorial = false
    });
  }

  cerrarHistorial(): void {
    this.modalHistorial = false;
    this.clienteSeleccionado = null;
    this.historial = null;
  }

  get totalClientes(): number { return this.clientes.length; }

  get clientesActivos(): number {
    return this.clientes.filter(c => c.estado === 'activo').length;
  }

  get clientesConDescuento(): number {
    return this.clientes.filter(c => c.cortes_para_descuento === 1).length;
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const parts = fecha.split('T')[0].split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${parseInt(parts[2])} ${meses[parseInt(parts[1])-1]} ${parts[0]}`;
  }

  formatHora(hora: string): string {
    if (!hora) return '';
    const [hh, mm] = hora.split(':').map(Number);
    const p = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2,'0')} ${p}`;
  }
}