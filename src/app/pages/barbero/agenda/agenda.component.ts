import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BarberoAgendaService, ICitaBarbero } from '../../../core/services/barbero-agenda.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit, OnDestroy {

  usuario: any = null;
  citasHoy: ICitaBarbero[] = [];
  proximas: ICitaBarbero[] = [];
  cargando = false;
  error = '';
  horaActual: Date = new Date();
  horarioBarberia: any[] = [];
  navActual: 'agenda' | 'proximas' = 'agenda';

  modalCita = false;
  citaSeleccionada: ICitaBarbero | null = null;
  modalCompletar = false;
  modalCancelar = false;
  procesando = false;

  // Modal presencial
  modalPresencial = false;
  servicios: any[] = [];
  presencialForm = { nombre: '', apellido: '', id_servicio: 0, fecha: '', hora: '' };
  presencialSlots: any[] = [];
  presencialCargandoSlots = false;
  presencialGuardando = false;
  presencialError = '';
  presencialExitoso = false;
  presencialMesActual: Date = new Date();
  presencialDiasCalendario: { fecha: Date | null; disponible: boolean }[] = [];
  presencialHoy: Date = new Date();

  private timerSub!: Subscription;

  constructor(
    private authService: AuthService,
    private agendaService: BarberoAgendaService,
    private reservaService: ReservaService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarDatos();
    this.cargarServicios();
    this.cargarHorarioBarberia();

    this.route.queryParams.subscribe((params: any) => {
      if (params['agendar'] === 'true') {
        setTimeout(() => this.abrirModalPresencial(), 300);
      }
    });

    this.timerSub = interval(30000).subscribe(() => {
      this.horaActual = new Date();
      this.cargarDatos();
    });

    setInterval(() => this.horaActual = new Date(), 1000);
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.agendaService.getCitasHoy().subscribe({
      next: (res) => { this.citasHoy = res.data; this.cargando = false; },
      error: () => { this.error = 'Error al cargar agenda'; this.cargando = false; }
    });
    this.agendaService.getProximas().subscribe({
      next: (res) => this.proximas = res.data,
      error: () => { }
    });
  }

  cargarServicios(): void {
    this.reservaService.getServicios().subscribe({
      next: (res) => this.servicios = res.data,
      error: () => { }
    });
  }

  cargarHorarioBarberia(): void {
    this.reservaService.getHorarioBarberia().subscribe({
      next: (res) => {
        this.horarioBarberia = res.data;
        this.generarCalendarioPresencial();
      },
      error: () => this.generarCalendarioPresencial()
    });
  }

  // ─── Timeline ─────────────────────────────────────────────
  readonly PX_POR_MINUTO = 1.2;

  get horasTimeline(): number[] {
    if (this.citasHoy.length === 0) return [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const horas = this.citasHoy.map(c => parseInt(c.hora.split(':')[0]));
    const min = Math.max(Math.min(...horas) - 1, 7);
    const max = Math.min(Math.max(...horas) + 2, 22);
    const result = [];
    for (let h = min; h <= max; h++) result.push(h);
    return result;
  }

  get alturaTimeline(): number {
    return this.horasTimeline.length * 60 * this.PX_POR_MINUTO;
  }

  horaAPixels(hora: string): number {
    const [hh, mm] = hora.split(':').map(Number);
    const minutos = hh * 60 + mm;
    const inicioMin = this.horasTimeline[0] * 60;
    return (minutos - inicioMin) * this.PX_POR_MINUTO;
  }

  duracionAPixels(duracion: number): number {
    const px = Number(duracion) * this.PX_POR_MINUTO;
    return Math.max(px, 80);
  }

  get lineaAhora(): number {
    const hh = this.horaActual.getHours();
    const mm = this.horaActual.getMinutes();
    return ((hh * 60 + mm) - (this.horasTimeline[0] * 60)) * this.PX_POR_MINUTO;
  }

  get mostrarLineaAhora(): boolean {
    const min = this.horasTimeline[0] * 60;
    const max = this.horasTimeline[this.horasTimeline.length - 1] * 60 + 60;
    const ahora = this.horaActual.getHours() * 60 + this.horaActual.getMinutes();
    return ahora >= min && ahora <= max;
  }

  getEstadoCita(cita: ICitaBarbero): 'completada' | 'en-curso' | 'proxima' {
    if (cita.estado === 'completada') return 'completada';
    const [hh, mm] = cita.hora.split(':').map(Number);
    const inicioMin = hh * 60 + mm;
    const finMin = inicioMin + (cita.duracion_total || 30);
    const ahoraMin = this.horaActual.getHours() * 60 + this.horaActual.getMinutes();
    if (ahoraMin >= inicioMin && ahoraMin < finMin) return 'en-curso';
    if (ahoraMin >= finMin) return 'completada';
    return 'proxima';
  }

  get marcasMinutos(): { top: number; label: string; esPrincipal: boolean }[] {
    const marcas: { top: number; label: string; esPrincipal: boolean }[] = [];
    for (const h of this.horasTimeline) {
      [0, 15, 30, 45].forEach(m => {
        const minTotal = h * 60 + m;
        const inicioMin = this.horasTimeline[0] * 60;
        const top = (minTotal - inicioMin) * this.PX_POR_MINUTO;
        const hh = Math.floor(minTotal / 60);
        const mm = minTotal % 60;
        const p = hh >= 12 ? 'PM' : 'AM';
        const h12 = hh % 12 || 12;
        const label = m === 0 ? `${h12} ${p}` : `${String(mm).padStart(2, '0')}`;
        marcas.push({ top, label, esPrincipal: m === 0 });
      });
    }
    return marcas;
  }

  getHoraFin(cita: ICitaBarbero): string {
    const [hh, mm] = cita.hora.split(':').map(Number);
    const inicioMin = hh * 60 + mm;
    const finMin = inicioMin + Number(cita.duracion_total || 30);
    const fhh = Math.floor(finMin / 60);
    const fmm = finMin % 60;
    const p = fhh >= 12 ? 'PM' : 'AM';
    const h12 = fhh % 12 || 12;
    return `${h12}:${String(fmm).padStart(2, '0')} ${p}`;
  }

  // ─── Stats ────────────────────────────────────────────────
  get citasCompletadas(): number {
    return this.citasHoy.filter(c => c.estado === 'completada').length;
  }

  get proximaCita(): ICitaBarbero | null {
    const ahora = this.horaActual.getHours() * 60 + this.horaActual.getMinutes();
    return this.citasHoy.find(c => {
      if (c.estado === 'completada') return false;
      const [hh, mm] = c.hora.split(':').map(Number);
      return hh * 60 + mm > ahora;
    }) || null;
  }

  // ─── Modal cita ───────────────────────────────────────────
  abrirModalCita(cita: ICitaBarbero): void {
    this.citaSeleccionada = cita;
    this.modalCita = true;
  }

  cerrarModalCita(): void {
    this.modalCita = false;
    this.citaSeleccionada = null;
  }

  confirmarCompletar(): void {
    this.modalCita = false;
    this.modalCompletar = true;
  }

  confirmarCancelar(): void {
    this.modalCita = false;
    this.modalCancelar = true;
  }

  completarCita(): void {
    if (!this.citaSeleccionada) return;
    this.procesando = true;
    this.agendaService.cambiarEstado(this.citaSeleccionada.id_reserva, 'completada').subscribe({
      next: () => {
        this.procesando = false;
        this.modalCompletar = false;

        // ✅ Actualizar localmente sin esperar reload
        const idx = this.citasHoy.findIndex(c => c.id_reserva === this.citaSeleccionada!.id_reserva);
        if (idx !== -1) {
          this.citasHoy[idx] = { ...this.citasHoy[idx], estado: 'completada' };
          this.citasHoy = [...this.citasHoy]; // forzar detección de cambios
        }

        this.citaSeleccionada = null;
        this.cargarDatos(); // sigue cargando en segundo plano
      },
      error: (err) => {
        this.procesando = false;
        this.error = err.error?.mensaje || 'Error al completar cita';
      }
    });
  }

  cancelarCita(): void {
    if (!this.citaSeleccionada) return;
    this.procesando = true;
    this.agendaService.cambiarEstado(this.citaSeleccionada.id_reserva, 'cancelada').subscribe({
      next: () => {
        this.procesando = false;
        this.modalCancelar = false;

        // ✅ Actualizar localmente sin esperar reload
        const idx = this.citasHoy.findIndex(c => c.id_reserva === this.citaSeleccionada!.id_reserva);
        if (idx !== -1) {
          this.citasHoy[idx] = { ...this.citasHoy[idx], estado: 'cancelada' };
          this.citasHoy = [...this.citasHoy];
        }

        this.citaSeleccionada = null;
        this.cargarDatos();
      },
      error: (err) => {
        this.procesando = false;
        this.error = err.error?.mensaje || 'Error al cancelar cita';
      }
    });
  }

  // ─── Modal presencial ─────────────────────────────────────
  abrirModalPresencial(): void {
    this.presencialForm = { nombre: '', apellido: '', id_servicio: 0, fecha: '', hora: '' };
    this.presencialSlots = [];
    this.presencialError = '';
    this.presencialExitoso = false;
    this.presencialMesActual = new Date();
    this.generarCalendarioPresencial();
    this.modalPresencial = true;
  }

  cerrarModalPresencial(): void {
    this.modalPresencial = false;
    this.presencialError = '';
  }

  esDiaAbiertoPresencial(fecha: Date): boolean {
    if (!this.horarioBarberia || this.horarioBarberia.length === 0) return true;
    const dia = fecha.getDay();
    const horario = this.horarioBarberia.find((h: any) => h.dia_semana === dia);
    return horario ? horario.activo === 1 : false;
  }

  generarCalendarioPresencial(): void {
    const año = this.presencialMesActual.getFullYear();
    const mes = this.presencialMesActual.getMonth();
    const primerDia = new Date(año, mes, 1).getDay();
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    this.presencialDiasCalendario = [];
    for (let i = 0; i < primerDia; i++) {
      this.presencialDiasCalendario.push({ fecha: null, disponible: false });
    }
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = new Date(año, mes, d);
      const pasado = fecha < new Date(this.presencialHoy.getFullYear(), this.presencialHoy.getMonth(), this.presencialHoy.getDate());
      const diaAbierto = this.esDiaAbiertoPresencial(fecha);
      this.presencialDiasCalendario.push({ fecha, disponible: !pasado && diaAbierto });
    }
  }

  presencialMesAnterior(): void {
    this.presencialMesActual = new Date(this.presencialMesActual.getFullYear(), this.presencialMesActual.getMonth() - 1, 1);
    this.generarCalendarioPresencial();
  }

  presencialMesSiguiente(): void {
    this.presencialMesActual = new Date(this.presencialMesActual.getFullYear(), this.presencialMesActual.getMonth() + 1, 1);
    this.generarCalendarioPresencial();
  }

  get presencialNombreMes(): string {
    return this.presencialMesActual.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }

  seleccionarFechaPresencial(dia: { fecha: Date | null; disponible: boolean }): void {
    if (!dia.fecha || !dia.disponible) return;
    const f = dia.fecha;
    this.presencialForm.fecha = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
    this.presencialForm.hora = '';
    this.cargarSlotsPresencial();
  }

  esDiaSeleccionadoPresencial(dia: { fecha: Date | null }): boolean {
    if (!dia.fecha || !this.presencialForm.fecha) return false;
    const f = dia.fecha;
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}` === this.presencialForm.fecha;
  }

  esDiaCerradoPresencial(dia: { fecha: Date | null; disponible: boolean }): boolean {
    if (!dia.fecha || !this.horarioBarberia || this.horarioBarberia.length === 0) return false;
    const diaSemana = dia.fecha.getDay();
    const horario = this.horarioBarberia.find((h: any) => h.dia_semana === diaSemana);
    return horario ? horario.activo === 0 : true;
  }

  cargarSlotsPresencial(): void {
    if (!this.presencialForm.fecha || !this.usuario) return;
    this.presencialCargandoSlots = true;
    this.reservaService.getDisponibilidad(
      this.usuario.id_usuario,
      this.presencialForm.fecha,
      30
    ).subscribe({
      next: (res) => {
        this.presencialSlots = res.data.disponible ? res.data.slots : [];
        this.presencialCargandoSlots = false;
      },
      error: () => { this.presencialSlots = []; this.presencialCargandoSlots = false; }
    });
  }

  guardarPresencial(): void {
    if (!this.presencialForm.nombre || !this.presencialForm.apellido) {
      this.presencialError = 'Ingresa nombre y apellido del cliente';
      return;
    }
    if (!this.presencialForm.id_servicio || this.presencialForm.id_servicio === 0) {
      this.presencialError = 'Selecciona un servicio';
      return;
    }
    if (!this.presencialForm.fecha || !this.presencialForm.hora) {
      this.presencialError = 'Selecciona fecha y hora';
      return;
    }
    this.presencialGuardando = true;
    this.presencialError = '';
    this.agendaService.registrarPresencial(this.presencialForm).subscribe({
      next: () => {
        this.presencialGuardando = false;
        this.presencialExitoso = true;
        this.cargarDatos();
        setTimeout(() => {
          this.presencialExitoso = false;
          this.cerrarModalPresencial();
        }, 2000);
      },
      error: (err: any) => {
        this.presencialError = err.error?.mensaje || 'Error al registrar';
        this.presencialGuardando = false;
      }
    });
  }

  // ─── Utils ────────────────────────────────────────────────
  formatHora(hora: string): string {
    if (!hora) return '';
    const [hh, mm] = hora.split(':').map(Number);
    const p = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${p}`;
  }

  formatHoraNum(h: number): string {
    const p = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12} ${p}`;
  }

  formatFechaCorta(fecha: string): string {
    if (!fecha) return '';
    const parts = fecha.split('T')[0].split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${parseInt(parts[2])} ${meses[parseInt(parts[1]) - 1]}`;
  }

  formatFechaHoy(): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const hoy = new Date();
    return `${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;
  }

  get horaActualStr(): string {
    const hh = this.horaActual.getHours();
    const mm = this.horaActual.getMinutes();
    const ss = this.horaActual.getSeconds();
    const p = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')} ${p}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}