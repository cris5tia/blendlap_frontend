import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BarberoAgendaService, ICitaBarbero } from '../../../core/services/barbero-agenda.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { ToastService } from '../../../core/services/toast.service';
import { BarberoPresencialModalService } from '../../../core/services/barbero-presencial-modal.service';
import { SocketService } from '../../../core/services/socket.service';
import { timer, Subject, forkJoin } from 'rxjs';
import { exhaustMap, takeUntil, take } from 'rxjs/operators';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit, OnDestroy {

  usuario: any = null;
  citasHoy: ICitaBarbero[] = [];
  proximas: ICitaBarbero[] = [];
  cargando = true;
  error = '';
  horaActual: Date = new Date();
  horarioBarberia: any[] = [];
  navActual: 'agenda' | 'proximas' = 'agenda';

  readonly PX_POR_MINUTO = 2.0;
  horasTimeline: number[] = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  alturaTimeline = this.horasTimeline.length * 60 * this.PX_POR_MINUTO;
  marcasMinutos: { top: number; label: string; esPrincipal: boolean }[] = [];

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
  presencialDropdownAbierto = false;
  presencialMesActual: Date = new Date();
  presencialDiasCalendario: { fecha: Date | null; disponible: boolean }[] = [];
  presencialHoy: Date = new Date();

  private destroy$ = new Subject<void>();
  private clockInterval: any;

  constructor(
    private authService: AuthService,
    private agendaService: BarberoAgendaService,
    private reservaService: ReservaService,
    private toast: ToastService,
    private presencialModalService: BarberoPresencialModalService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarServicios();
    this.cargarHorarioBarberia();
    this.recalcularTimeline();

    // Default: mostrar mañana en Próximas al entrar
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    this.onFiltroFechaChange(this.fechaLocalISO(tm));

    timer(0, 30000).pipe(
      exhaustMap(() => forkJoin({
        hoy: this.agendaService.getCitasHoy(),
        proximas: this.agendaService.getProximas()
      })),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ hoy, proximas }) => {
        this.citasHoy = hoy.data;
        this.proximas = proximas.data;
        this.recalcularTimeline();
        this.cargando = false;
      },
      error: () => { this.error = 'Error al cargar agenda'; this.cargando = false; }
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params: any) => {
      if (params['agendar'] === 'true') {
        setTimeout(() => this.abrirModalPresencial(), 300);
      }
    });

    this.presencialModalService.reservaCreada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarDatos());

    // Tiempo real: recargar agenda cuando llegue un evento de reserva
    this.socketService.connect();
    this.socketService.onReservaNueva()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarDatos());
    this.socketService.onReservaActualizada()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarDatos());
    this.socketService.onReservaEliminada()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarDatos());

    this.clockInterval = setInterval(() => this.horaActual = new Date(), 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.clockInterval);
  }

  cargarDatos(): void {
    this.cargando = true;
    forkJoin({
      hoy: this.agendaService.getCitasHoy(),
      proximas: this.agendaService.getProximas()
    }).pipe(take(1)).subscribe({
      next: ({ hoy, proximas }) => {
        this.citasHoy = hoy.data;
        this.proximas = proximas.data;
        this.recalcularTimeline();
        this.cargando = false;
      },
      error: () => { this.error = 'Error al cargar agenda'; this.cargando = false; }
    });
  }

  cargarServicios(): void {
    this.reservaService.getServicios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => this.servicios = res.data,
      error: () => { }
    });
  }

  cargarHorarioBarberia(): void {
    this.reservaService.getHorarioBarberia().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.horarioBarberia = res.data;
        this.generarCalendarioPresencial();
      },
      error: () => this.generarCalendarioPresencial()
    });
  }

  // ─── Timeline ─────────────────────────────────────────────
  recalcularTimeline(): void {
    this.horasTimeline = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    this.alturaTimeline = this.horasTimeline.length * 60 * this.PX_POR_MINUTO;
    this.marcasMinutos = this.generarMarcasMinutos();
  }

  horaAPixels(hora: string): number {
    const [hh, mm] = hora.split(':').map(Number);
    const minutos = hh * 60 + mm;
    const inicioMin = this.horasTimeline[0] * 60;
    return (minutos - inicioMin) * this.PX_POR_MINUTO;
  }

  duracionAPixels(duracion: number): number {
    return Math.max(20, (duracion || 30) * this.PX_POR_MINUTO - 4);
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
    const fechaCita = this.normalizarFecha(cita.fecha);
    const hoy = this.fechaLocalISO(new Date());

    if (fechaCita && fechaCita > hoy) return cita.estado === 'completada' ? 'completada' : 'proxima';
    if (fechaCita && fechaCita < hoy) return cita.estado === 'completada' ? 'completada' : 'proxima';

    const [hh, mm] = cita.hora.split(':').map(Number);
    const inicioMin = hh * 60 + mm;
    const finMin = inicioMin + Number(cita.duracion_total || 30);
    const ahoraMin = this.horaActual.getHours() * 60 + this.horaActual.getMinutes();

    // Citas que no han empezado → siempre gris, sin importar el estado en BD
    if (ahoraMin < inicioMin) return 'proxima';

    // Ya empezó: respeta si el barbero la marcó como completada
    if (cita.estado === 'completada') return 'completada';

    // En progreso o la hora ya pasó → verde automático
    if (ahoraMin < finMin) return 'en-curso';
    return 'completada';
  }

  generarMarcasMinutos(): { top: number; label: string; esPrincipal: boolean }[] {
    const marcas: { top: number; label: string; esPrincipal: boolean }[] = [];
    const inicioMin = this.horasTimeline[0] * 60;
    for (const h of this.horasTimeline) {
      [0, 15, 30, 45].forEach(m => {
        const minTotal = h * 60 + m;
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

  puedeGestionarCita(cita: ICitaBarbero | null): boolean {
    if (!cita) return false;
    return this.getEstadoCita(cita) === 'proxima';
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

  cancelarProxima(cita: ICitaBarbero): void {
    this.citaSeleccionada = cita;
    this.modalCancelar = true;
  }

  completarCita(): void {
    if (!this.citaSeleccionada) return;
    this.procesando = true;
    const nombre = this.citaSeleccionada.nombre_cliente;
    this.agendaService.cambiarEstado(this.citaSeleccionada.id_reserva, 'completada').subscribe({
      next: () => {
        this.procesando = false;
        this.modalCompletar = false;
        const idx = this.citasHoy.findIndex(c => c.id_reserva === this.citaSeleccionada!.id_reserva);
        if (idx !== -1) {
          this.citasHoy[idx] = { ...this.citasHoy[idx], estado: 'completada' };
          this.citasHoy = [...this.citasHoy];
        }
        this.citaSeleccionada = null;
        this.cargarDatos();
        this.toast.success('Cita completada', `La cita de ${nombre} fue marcada como completada.`);
      },
      error: (err) => {
        this.procesando = false;
        this.toast.error('Error', err.error?.mensaje || 'No se pudo completar la cita.');
      }
    });
  }

  cancelarCita(): void {
    if (!this.citaSeleccionada) return;
    this.procesando = true;
    const nombre = this.citaSeleccionada.nombre_cliente;
    this.agendaService.cambiarEstado(this.citaSeleccionada.id_reserva, 'cancelada').subscribe({
      next: () => {
        this.procesando = false;
        this.modalCancelar = false;
        const idx = this.citasHoy.findIndex(c => c.id_reserva === this.citaSeleccionada!.id_reserva);
        if (idx !== -1) {
          this.citasHoy[idx] = { ...this.citasHoy[idx], estado: 'cancelada' };
          this.citasHoy = [...this.citasHoy];
        }
        this.citaSeleccionada = null;
        this.cargarDatos();
        this.toast.warning('Cita cancelada', `La cita de ${nombre} fue cancelada.`);
      },
      error: (err) => {
        this.procesando = false;
        this.toast.error('Error', err.error?.mensaje || 'No se pudo cancelar la cita.');
      }
    });
  }

  // ─── Modal presencial ─────────────────────────────────────
  abrirModalPresencial(): void {
    this.presencialForm = { nombre: '', apellido: '', id_servicio: 0, fecha: '', hora: '' };
    this.presencialSlots = [];
    this.presencialError = '';
    this.presencialExitoso = false;
    this.presencialDropdownAbierto = false;
    this.presencialMesActual = new Date();
    this.generarCalendarioPresencial();
    this.modalPresencial = true;
  }

  get servicioSeleccionado(): any {
    return this.servicios.find(s => s.id_servicio === +this.presencialForm.id_servicio) || null;
  }

  seleccionarServicioPresencial(s: any): void {
    this.presencialForm.id_servicio = s.id_servicio;
    this.presencialDropdownAbierto = false;
    this.presencialForm.hora = '';
    if (this.presencialForm.fecha) {
      this.cargarSlotsPresencial();
    }
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
    const duracion = this.servicioSeleccionado?.duracion || 30;
    this.reservaService.getDisponibilidad(
      this.usuario.id_usuario,
      this.presencialForm.fecha,
      duracion
    ).subscribe({
      next: (res) => {
        let slots = res.data.disponible ? res.data.slots : [];
        const ahora = new Date();
        const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
        if (this.presencialForm.fecha === hoyStr) {
          const minutoMinimo = ahora.getHours() * 60 + ahora.getMinutes() + 15;
          slots = slots.filter((slot: any) => {
            const [hh, mm] = slot.hora.split(':').map(Number);
            return (hh * 60 + mm) >= minutoMinimo;
          });
        }
        this.presencialSlots = slots;
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
        this.toast.success(
          'Reserva creada',
          `La cita de ${this.presencialForm.nombre} ${this.presencialForm.apellido} fue agendada exitosamente.`
        );
        setTimeout(() => {
          this.presencialExitoso = false;
          this.cerrarModalPresencial();
        }, 2000);
      },
      error: (err: any) => {
        this.presencialError = err.error?.mensaje || 'Error al registrar';
        this.presencialGuardando = false;
        this.toast.error('Error al agendar', err.error?.mensaje || 'No se pudo crear la reserva.');
      }
    });
  }

  // ─── Filtro próximas ──────────────────────────────────────
  filtroFecha = '';
  citasParaFecha: ICitaBarbero[] = [];
  cargandoFecha = false;

  onFiltroFechaChange(fecha: string): void {
    this.filtroFecha = fecha;
    this.citasParaFecha = [];
    if (!fecha) return;
    this.cargandoFecha = true;
    this.agendaService.getCitasByFecha(fecha).pipe(take(1)).subscribe({
      next: (res) => { this.citasParaFecha = res.data; this.cargandoFecha = false; },
      error: () => { this.citasParaFecha = []; this.cargandoFecha = false; }
    });
  }

  get fechasUnicas(): string[] {
    const set = new Set(this.proximas.map(r => this.normalizarFecha(r.fecha)));
    return Array.from(set).sort();
  }

  get proximasFiltradas(): ICitaBarbero[] {
    const fecha = this.fechaProximaSeleccionada;
    if (!fecha) return [];
    if (this.filtroFecha) {
      return [...this.citasParaFecha].sort((a, b) => a.hora.localeCompare(b.hora));
    }
    return this.proximas
      .filter(r => this.normalizarFecha(r.fecha) === fecha)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  get fechaProximaSeleccionada(): string {
    return this.filtroFecha || this.fechasUnicas[0] || '';
  }

  get mostrarLineaAhoraProximas(): boolean {
    return this.fechaProximaSeleccionada === this.fechaLocalISO(new Date()) && this.mostrarLineaAhora;
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

  formatFechaHoy(): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const hoy = new Date();
    return `${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;
  }

  formatFechaCompleta(fechaISO: string): string {
    if (!fechaISO) return '';
    const [year, month, day] = this.normalizarFecha(fechaISO).split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
  }

  normalizarFecha(fecha: string): string {
    return (fecha || '').split('T')[0];
  }

  fechaLocalISO(fecha: Date): string {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }

  get horaActualStr(): string {
    const hh = this.horaActual.getHours();
    const mm = this.horaActual.getMinutes();
    const ss = this.horaActual.getSeconds();
    const p = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')} ${p}`;
  }

}

