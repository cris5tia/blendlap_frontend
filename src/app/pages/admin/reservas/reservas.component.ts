import { Component, OnInit } from '@angular/core';
import { ReservaService, IReserva } from '../../../core/services/reserva.service';
import { BarberoService, IBarbero } from '../../../core/services/barbero.service';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.scss']
})
export class ReservasComponent implements OnInit {

  reservas: IReserva[] = [];
  barberos: IBarbero[] = [];
  cargando = false;
  error = '';

  filtros = {
    fecha: '',
    id_barbero: '',
    estado: ''
  };

  estados = ['pendiente', 'completada', 'cancelada'];

  modalEstado = false;
  reservaSeleccionada: IReserva | null = null;
  nuevoEstado = '';
  cambiando = false;

  modalCancelar = false;
  reservaACancelar: IReserva | null = null;
  cancelando = false;

  constructor(
    private reservaService: ReservaService,
    private barberoService: BarberoService
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
    this.cargarBarberos();
  }

  cargarReservas(): void {
    this.cargando = true;
    this.error = '';
    this.reservaService.getAllAdmin(this.filtros).subscribe({
      next: (res) => {
        this.reservas = res.data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar reservas';
        this.cargando = false;
      }
    });
  }

  cargarBarberos(): void {
    this.barberoService.getAll().subscribe({
      next: (res) => this.barberos = res.data,
      error: () => {}
    });
  }

  aplicarFiltros(): void {
    this.cargarReservas();
  }

  limpiarFiltros(): void {
    this.filtros = { fecha: '', id_barbero: '', estado: '' };
    this.cargarReservas();
  }

  abrirModalEstado(reserva: IReserva): void {
    this.reservaSeleccionada = reserva;
    this.nuevoEstado = reserva.estado;
    this.modalEstado = true;
  }

  cerrarModalEstado(): void {
    this.modalEstado = false;
    this.reservaSeleccionada = null;
  }

  cambiarEstado(): void {
    if (!this.reservaSeleccionada || !this.nuevoEstado) return;
    this.cambiando = true;
    this.reservaService.cambiarEstado(this.reservaSeleccionada.id_reserva, this.nuevoEstado).subscribe({
      next: () => {
        this.cambiando = false;
        this.cerrarModalEstado();
        this.cargarReservas();
      },
      error: () => {
        this.cambiando = false;
        this.error = 'Error al cambiar estado';
      }
    });
  }

  confirmarCancelar(reserva: IReserva): void {
    this.reservaACancelar = reserva;
    this.modalCancelar = true;
  }

  cancelarReserva(): void {
    if (!this.reservaACancelar) return;
    this.cancelando = true;
    this.reservaService.cancelar(this.reservaACancelar.id_reserva).subscribe({
      next: () => {
        this.cancelando = false;
        this.modalCancelar = false;
        this.reservaACancelar = null;
        this.cargarReservas();
      },
      error: () => {
        this.cancelando = false;
        this.error = 'Error al cancelar reserva';
      }
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'completada': return 'badge-success';
      case 'pendiente': return 'badge-warning';
      case 'cancelada': return 'badge-danger';
      default: return 'badge-default';
    }
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const [año, mes, dia] = fecha.split('T')[0].split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${parseInt(dia)} ${meses[parseInt(mes)-1]} ${año}`;
  }

  formatHora(hora: string): string {
    if (!hora) return '';
    const [hh, mm] = hora.split(':').map(Number);
    const periodo = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${periodo}`;
  }

  get totalPendientes(): number {
    return this.reservas.filter(r => r.estado === 'pendiente').length;
  }

  get totalCompletadas(): number {
    return this.reservas.filter(r => r.estado === 'completada').length;
  }

  get totalCanceladas(): number {
    return this.reservas.filter(r => r.estado === 'cancelada').length;
  }
}