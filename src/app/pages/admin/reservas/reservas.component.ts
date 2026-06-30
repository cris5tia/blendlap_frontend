import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReservaService, IReserva } from '../../../core/services/reserva.service';
import { BarberoService, IBarbero } from '../../../core/services/barbero.service';
import { ToastService } from '../../../core/services/toast.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.scss']
})
export class ReservasComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  reservas: IReserva[] = [];
  barberos: IBarbero[] = [];
  cargando = false;

  filtros = {
    fecha: '',
    id_barbero: '',
    estado: ''
  };

  estados = ['pendiente', 'completada', 'cancelada'];

  reservaDetalle: IReserva | null = null;

  modalEstado = false;
  reservaSeleccionada: IReserva | null = null;
  nuevoEstado = '';
  cambiando = false;

  modalCancelar = false;
  reservaACancelar: IReserva | null = null;
  cancelando = false;

  constructor(
    private reservaService: ReservaService,
    private barberoService: BarberoService,
    private toastService: ToastService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
    this.cargarBarberos();

    // Tiempo real: recargar al recibir eventos de reserva
    this.socketService.connect();
    this.socketService.onReservaNueva()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarReservas());
    this.socketService.onReservaActualizada()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarReservas());
    this.socketService.onReservaEliminada()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarReservas());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarReservas(): void {
    this.cargando = true;
    this.reservaService.getAllAdmin(this.filtros).subscribe({
      next: (res) => {
        this.reservas = res.data;
        this.cargando = false;
      },
      error: () => {
        this.toastService.error('Error al cargar reservas');
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

  abrirDetalle(reserva: IReserva): void {
    this.reservaDetalle = reserva;
  }

  cerrarDetalle(): void {
    this.reservaDetalle = null;
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
        this.toastService.success('Estado actualizado');
      },
      error: () => {
        this.cambiando = false;
        this.toastService.error('Error al cambiar estado');
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
        this.toastService.success('Reserva cancelada');
      },
      error: () => {
        this.cancelando = false;
        this.toastService.error('Error al cancelar reserva');
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