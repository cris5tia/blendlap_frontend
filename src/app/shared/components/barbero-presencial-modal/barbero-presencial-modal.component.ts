import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BarberoAgendaService } from '../../../core/services/barbero-agenda.service';
import { BarberoPresencialModalService } from '../../../core/services/barbero-presencial-modal.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-barbero-presencial-modal',
  templateUrl: './barbero-presencial-modal.component.html',
  styleUrls: ['./barbero-presencial-modal.component.scss']
})
export class BarberoPresencialModalComponent implements OnInit, OnDestroy {
  abierto = false;
  usuario: any = null;
  servicios: any[] = [];
  horarioBarberia: any[] = [];

  form = { nombre: '', apellido: '', id_servicio: 0, fecha: '', hora: '' };
  slots: any[] = [];
  cargandoSlots = false;
  guardando = false;
  error = '';
  exitoso = false;
  dropdownAbierto = false;
  mesActual: Date = new Date();
  diasCalendario: { fecha: Date | null; disponible: boolean }[] = [];
  hoy: Date = new Date();

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private agendaService: BarberoAgendaService,
    private modalService: BarberoPresencialModalService,
    private reservaService: ReservaService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarServicios();
    this.cargarHorarioBarberia();

    this.modalService.abierto$
      .pipe(takeUntil(this.destroy$))
      .subscribe(abierto => {
        this.abierto = abierto;
        if (abierto) this.resetear();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarServicios(): void {
    this.reservaService.getServicios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => this.servicios = res.data,
      error: () => {}
    });
  }

  cargarHorarioBarberia(): void {
    this.reservaService.getHorarioBarberia().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.horarioBarberia = res.data;
        this.generarCalendario();
      },
      error: () => this.generarCalendario()
    });
  }

  resetear(): void {
    this.form = { nombre: '', apellido: '', id_servicio: 0, fecha: '', hora: '' };
    this.slots = [];
    this.error = '';
    this.exitoso = false;
    this.dropdownAbierto = false;
    this.mesActual = new Date();
    this.generarCalendario();
  }

  cerrar(): void {
    this.modalService.cerrar();
    this.error = '';
  }

  get servicioSeleccionado(): any {
    return this.servicios.find(s => s.id_servicio === +this.form.id_servicio) || null;
  }

  seleccionarServicio(s: any): void {
    this.form.id_servicio = s.id_servicio;
    this.dropdownAbierto = false;
    this.form.hora = '';
    if (this.form.fecha) this.cargarSlots();
  }

  esDiaAbierto(fecha: Date): boolean {
    if (!this.horarioBarberia || this.horarioBarberia.length === 0) return true;
    const dia = fecha.getDay();
    const horario = this.horarioBarberia.find((h: any) => h.dia_semana === dia);
    return horario ? horario.activo === 1 : false;
  }

  generarCalendario(): void {
    const anio = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    this.diasCalendario = [];
    for (let i = 0; i < primerDia; i++) {
      this.diasCalendario.push({ fecha: null, disponible: false });
    }
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = new Date(anio, mes, d);
      const pasado = fecha < new Date(this.hoy.getFullYear(), this.hoy.getMonth(), this.hoy.getDate());
      const diaAbierto = this.esDiaAbierto(fecha);
      this.diasCalendario.push({ fecha, disponible: !pasado && diaAbierto });
    }
  }

  mesAnterior(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.generarCalendario();
  }

  mesSiguiente(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.generarCalendario();
  }

  get nombreMes(): string {
    return this.mesActual.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }

  seleccionarFecha(dia: { fecha: Date | null; disponible: boolean }): void {
    if (!dia.fecha || !dia.disponible) return;
    const f = dia.fecha;
    this.form.fecha = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
    this.form.hora = '';
    this.cargarSlots();
  }

  esDiaSeleccionado(dia: { fecha: Date | null }): boolean {
    if (!dia.fecha || !this.form.fecha) return false;
    const f = dia.fecha;
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}` === this.form.fecha;
  }

  esDiaCerrado(dia: { fecha: Date | null; disponible: boolean }): boolean {
    if (!dia.fecha || !this.horarioBarberia || this.horarioBarberia.length === 0) return false;
    const diaSemana = dia.fecha.getDay();
    const horario = this.horarioBarberia.find((h: any) => h.dia_semana === diaSemana);
    return horario ? horario.activo === 0 : true;
  }

  cargarSlots(): void {
    if (!this.form.fecha || !this.usuario) return;
    this.cargandoSlots = true;
    const duracion = this.servicioSeleccionado?.duracion || 30;
    this.reservaService.getDisponibilidad(this.usuario.id_usuario, this.form.fecha, duracion).subscribe({
      next: (res) => {
        let slots = res.data.disponible ? res.data.slots : [];
        const ahora = new Date();
        const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
        if (this.form.fecha === hoyStr) {
          const minutoMinimo = ahora.getHours() * 60 + ahora.getMinutes() + 15;
          slots = slots.filter((slot: any) => {
            const [hh, mm] = slot.hora.split(':').map(Number);
            return (hh * 60 + mm) >= minutoMinimo;
          });
        }
        this.slots = slots;
        this.cargandoSlots = false;
      },
      error: () => {
        this.slots = [];
        this.cargandoSlots = false;
      }
    });
  }

  guardar(): void {
    if (!this.form.nombre || !this.form.apellido) {
      this.error = 'Ingresa nombre y apellido del cliente';
      return;
    }
    if (!this.form.id_servicio || this.form.id_servicio === 0) {
      this.error = 'Selecciona un servicio';
      return;
    }
    if (!this.form.fecha || !this.form.hora) {
      this.error = 'Selecciona fecha y hora';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.agendaService.registrarPresencial(this.form).subscribe({
      next: () => {
        this.guardando = false;
        this.exitoso = true;
        this.modalService.notificarReservaCreada();
        this.toast.success('Reserva creada', `La cita de ${this.form.nombre} ${this.form.apellido} fue agendada exitosamente.`);
        setTimeout(() => {
          this.exitoso = false;
          this.modalService.cerrar();
          this.router.navigate(['/barbero/agenda']);
        }, 1400);
      },
      error: (err: any) => {
        this.error = err.error?.mensaje || 'Error al registrar';
        this.guardando = false;
        this.toast.error('Error al agendar', err.error?.mensaje || 'No se pudo crear la reserva.');
      }
    });
  }

  formatHora(hora: string): string {
    const [hh, mm] = hora.split(':').map(Number);
    const p = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${p}`;
  }
}
