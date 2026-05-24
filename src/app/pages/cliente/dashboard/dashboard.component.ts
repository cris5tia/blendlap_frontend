import { Component, OnInit } from '@angular/core';
import { ReservaService, IReserva } from '../../../core/services/reserva.service';
import { ResenaService, IResena } from '../../../core/services/resena.service';
import { AuthService } from '../../../core/services/auth.service';
import { CreditoService, ICredito } from '../../../core/services/credito.service';
import { Router } from '@angular/router';
import { TabService } from '../../../core/services/tab.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  reservas: IReserva[] = [];
  cargando = false;
  error = '';
  usuario: any = null;
  tabActual: 'actuales' | 'historial' | 'creditos' = 'actuales';
  reservaExpandida: number | null = null;

  // Modal resena
  modalResena = false;
  reservaAResenar: IReserva | null = null;
  formularioResena: IResena = this.resenaVacia();
  guardandoResena = false;
  errorResena = '';
  resenaExitosa = false;
  estrellasHover = 0;

  // Modal editar
  modalEditar = false;
  editarExitoso = false;
  reservaAEditar: IReserva | null = null;
  editarFecha = '';
  editarHora = '';
  editarSlots: any[] = [];
  editarCargandoSlots = false;
  editarGuardando = false;
  editarError = '';
  editarMesActual: Date = new Date();
  editarDiasCalendario: { fecha: Date | null; disponible: boolean }[] = [];
  editarHoy: Date = new Date();
  horarioBarberia: any[] = [];

  constructor(
    private reservaService: ReservaService,
    private resenaService: ResenaService,
    private authService: AuthService,
    private creditoService: CreditoService,
    private tabService: TabService,
    private router: Router,

  ) { }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarReservas();
    this.cargarHorarioBarberia();
    this.cargarCreditos();
    this.tabService.tab$.subscribe(tab => {
      this.tabActual = tab as 'actuales' | 'historial' | 'creditos';
    });
  }

  cargarReservas(): void {
    this.cargando = true;
    this.reservaService.getMisReservas().subscribe({
      next: (res) => { this.reservas = res.data; this.cargando = false; },
      error: () => { this.error = 'Error al cargar tus reservas'; this.cargando = false; }
    });
  }
  /* ver estado de solicitud de credito */
  creditos: ICredito[] = [];
  cargandoCreditos = false;

  cargarCreditos(): void {
    this.cargandoCreditos = true;
    this.creditoService.getMisCreditos().subscribe({
      next: (res) => { this.creditos = res.data; this.cargandoCreditos = false; },
      error: () => { this.cargandoCreditos = false; }
    });
  }

  get creditosAprobados(): ICredito[] {
    return this.creditos.filter(c => c.estado === 'activo');
  }

  get creditosPendientes(): ICredito[] {
    return this.creditos.filter(c => c.estado === 'pendiente');
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v || 0);
  }

  formatFechaCorta2(fecha: string): string {
    if (!fecha) return '';
    const [y, m, d] = fecha.split('T')[0].split('-');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`;
  }

  cargarHorarioBarberia(): void {
    this.reservaService.getHorarioBarberia().subscribe({
      next: (res) => { this.horarioBarberia = res.data; this.generarCalendarioEditar(); },
      error: () => this.generarCalendarioEditar()
    });
  }

  get reservasPendientes(): IReserva[] {
    return this.reservas.filter(r => r.estado === 'pendiente' || r.estado === 'confirmada');
  }

  get reservasHistorial(): IReserva[] {
    return this.reservas.filter(r => r.estado === 'completada' || r.estado === 'cancelada');
  }

  toggleExpand(id: number): void {
    this.reservaExpandida = this.reservaExpandida === id ? null : id;
  }

  estaExpandida(id: number): boolean {
    return this.reservaExpandida === id;
  }

  // ─── Editar ───────────────────────────────────────────────
  abrirModalEditar(reserva: IReserva): void {
    this.reservaAEditar = reserva;
    this.editarFecha = '';
    this.editarHora = '';
    this.editarSlots = [];
    this.editarError = '';
    this.editarMesActual = new Date();
    this.generarCalendarioEditar();
    this.modalEditar = true;
  }

  cerrarModalEditar(): void {
    this.modalEditar = false;
    this.reservaAEditar = null;
  }

  esDiaAbierto(fecha: Date): boolean {
    if (this.horarioBarberia.length === 0) return true;
    const dia = fecha.getDay();
    const horario = this.horarioBarberia.find((h: any) => h.dia_semana === dia);
    return horario ? horario.activo === 1 : false;
  }

  generarCalendarioEditar(): void {
    const año = this.editarMesActual.getFullYear();
    const mes = this.editarMesActual.getMonth();
    const primerDia = new Date(año, mes, 1).getDay();
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    this.editarDiasCalendario = [];
    for (let i = 0; i < primerDia; i++) {
      this.editarDiasCalendario.push({ fecha: null, disponible: false });
    }
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = new Date(año, mes, d);
      const pasado = fecha < new Date(this.editarHoy.getFullYear(), this.editarHoy.getMonth(), this.editarHoy.getDate());
      const diaAbierto = this.esDiaAbierto(fecha);
      this.editarDiasCalendario.push({ fecha, disponible: !pasado && diaAbierto });
    }
  }

  editarMesAnterior(): void {
    this.editarMesActual = new Date(this.editarMesActual.getFullYear(), this.editarMesActual.getMonth() - 1, 1);
    this.generarCalendarioEditar();
  }

  editarMesSiguiente(): void {
    this.editarMesActual = new Date(this.editarMesActual.getFullYear(), this.editarMesActual.getMonth() + 1, 1);
    this.generarCalendarioEditar();
  }

  get editarNombreMes(): string {
    return this.editarMesActual.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }

  seleccionarFechaEditar(dia: { fecha: Date | null; disponible: boolean }): void {
    if (!dia.fecha || !dia.disponible) return;
    const f = dia.fecha;
    this.editarFecha = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
    this.editarHora = '';
    this.cargarSlotsEditar();
  }

  esDiaSeleccionadoEditar(dia: { fecha: Date | null }): boolean {
    if (!dia.fecha || !this.editarFecha) return false;
    const f = dia.fecha;
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}` === this.editarFecha;
  }

  esDiaCerradoEditar(dia: { fecha: Date | null; disponible: boolean }): boolean {
    if (!dia.fecha) return false;
    if (this.horarioBarberia.length === 0) return false;
    const diaSemana = dia.fecha.getDay();
    const horario = this.horarioBarberia.find((h: any) => h.dia_semana === diaSemana);
    return horario ? horario.activo === 0 : true;
  }

  cargarSlotsEditar(): void {
    if (!this.reservaAEditar || !this.editarFecha) return;
    this.editarCargandoSlots = true;
    const duracion = this.reservaAEditar.duracion_total || 30;
    this.reservaService.getDisponibilidad(
      this.reservaAEditar.id_barbero,
      this.editarFecha,
      duracion
    ).subscribe({
      next: (res) => {
        this.editarSlots = res.data.disponible ? res.data.slots : [];
        this.editarCargandoSlots = false;
      },
      error: () => { this.editarSlots = []; this.editarCargandoSlots = false; }
    });
  }

  guardarEdicion(): void {
    if (!this.reservaAEditar || !this.editarFecha || !this.editarHora) {
      this.editarError = 'Selecciona fecha y hora';
      return;
    }
    this.editarGuardando = true;
    this.editarError = '';
    this.reservaService.actualizar(this.reservaAEditar.id_reserva, {
      fecha: this.editarFecha,
      hora: this.editarHora
    }).subscribe({
      next: () => {
        this.editarGuardando = false;
        this.cerrarModalEditar();
        this.cargarReservas();
        this.editarExitoso = true;
        setTimeout(() => this.editarExitoso = false, 2500);
      },
      error: (err) => {
        this.editarError = err.error?.mensaje || 'Error al modificar la reserva';
        this.editarGuardando = false;
      }
    });
  }

  // ─── Resena ───────────────────────────────────────────────
  puedeResenar(reserva: IReserva): boolean {
    return reserva.estado === 'completada' && !reserva.tiene_resena;
  }

  estadoCitaLabel(estado: string): string {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      completada: 'Completada',
      cancelada: 'Cancelada'
    };
    return labels[estado] || estado;
  }

  abrirModalResena(reserva: IReserva): void {
    this.reservaAResenar = reserva;
    this.formularioResena = this.resenaVacia();
    this.formularioResena.id_reserva = reserva.id_reserva;
    this.formularioResena.id_barbero = reserva.id_barbero;
    this.errorResena = '';
    this.resenaExitosa = false;
    this.modalResena = true;
  }

  cerrarModalResena(): void {
    this.modalResena = false;
    this.reservaAResenar = null;
    this.estrellasHover = 0;
  }

  setEstrellas(n: number): void {
    this.formularioResena.calificacion = n;
  }

  guardarResena(): void {
    if (!this.formularioResena.calificacion) {
      this.errorResena = 'Selecciona una calificacion';
      return;
    }
    this.guardandoResena = true;
    this.errorResena = '';
    this.resenaService.crear(this.formularioResena).subscribe({
      next: () => {
        this.guardandoResena = false;
        this.resenaExitosa = true;
        const r = this.reservas.find(r => r.id_reserva === this.reservaAResenar?.id_reserva);
        if (r) r.tiene_resena = true;
        setTimeout(() => this.cerrarModalResena(), 2000);
      },
      error: (err) => {
        this.errorResena = err.error?.mensaje || 'Error al enviar la resena';
        this.guardandoResena = false;
      }
    });
  }

  cancelarReserva(reserva: IReserva): void {
    if (!confirm('Estas seguro de cancelar esta reserva?')) return;
    this.reservaService.cancelar(reserva.id_reserva).subscribe({
      next: () => this.cargarReservas(),
      error: () => this.error = 'Error al cancelar la reserva'
    });
  }

  formatFechaCompleta(fecha: string): string {
    if (!fecha) return '';
    const parts = fecha.split('T')[0].split('-');
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${parseInt(parts[2])} de ${meses[parseInt(parts[1]) - 1]} de ${parts[0]}`;
  }

  formatFechaCorta(fecha: string): string {
    if (!fecha) return '';
    const parts = fecha.split('T')[0].split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${parseInt(parts[2])} ${meses[parseInt(parts[1]) - 1]}`;
  }

  esHoy(fecha: string): boolean {
    if (!fecha) return false;
    const f = new Date(fecha.split('T')[0] + 'T12:00:00');
    return f.toDateString() === new Date().toDateString();
  }

  esManana(fecha: string): boolean {
    if (!fecha) return false;
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const f = new Date(fecha.split('T')[0] + 'T12:00:00');
    return f.toDateString() === manana.toDateString();
  }

  getFechaLabel(fecha: string): string {
    if (this.esHoy(fecha)) return 'Hoy';
    if (this.esManana(fecha)) return 'Manana';
    return this.formatFechaCorta(fecha);
  }

  formatHora(hora: string): string {
    if (!hora) return '';
    const [hh, mm] = hora.split(':').map(Number);
    const periodo = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${periodo}`;
  }

  irAReservar(): void {
    this.router.navigate(['/agendar']);
  }

  private resenaVacia(): IResena {
    return { id_barbero: 0, id_reserva: 0, calificacion: 0, comentario: '' };
  }
  modalCancelar = false;
  reservaACancelar: IReserva | null = null;
  cancelando = false;

  confirmarCancelar(reserva: IReserva): void {
    this.reservaACancelar = reserva;
    this.modalCancelar = true;
  }

  ejecutarCancelar(): void {
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
        this.error = 'Error al cancelar la reserva';
      }
    });
  }
}
