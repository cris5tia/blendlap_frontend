import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BarberoAgendaService, ICitaBarbero } from '../../../core/services/barbero-agenda.service';
import { ReservaService } from '../../../core/services/reserva.service';

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
  private timer: any;

  navActual: 'agenda' | 'proximas' = 'agenda';

  modalCompletar = false;
  modalCancelar = false;
  citaSeleccionada: ICitaBarbero | null = null;
  procesando = false;

  constructor(
    private authService: AuthService,
    private agendaService: BarberoAgendaService,
    private reservaService: ReservaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarDatos();
    this.timer = setInterval(() => {
      this.horaActual = new Date();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  cargarDatos(): void {
    this.cargando = true;
    this.agendaService.getCitasHoy().subscribe({
      next: (res) => {
        this.citasHoy = res.data;
        this.cargando = false;
      },
      error: () => { this.error = 'Error al cargar agenda'; this.cargando = false; }
    });
    this.agendaService.getProximas().subscribe({
      next: (res) => this.proximas = res.data,
      error: () => {}
    });
  }

  // ─── Timeline logic ───────────────────────────────────────
  get horasTimeline(): number[] {
    if (this.citasHoy.length === 0) return [9,10,11,12,13,14,15,16,17,18,19,20];
    const horas = this.citasHoy.map(c => parseInt(c.hora.split(':')[0]));
    const min = Math.max(Math.min(...horas) - 1, 7);
    const max = Math.min(Math.max(...horas) + 2, 21);
    const result = [];
    for (let h = min; h <= max; h++) result.push(h);
    return result;
  }

  get alturaTimeline(): number {
    return this.horasTimeline.length * 60;
  }

  horaAPixels(hora: string): number {
    const [hh, mm] = hora.split(':').map(Number);
    const minutos = hh * 60 + mm;
    const inicioMin = this.horasTimeline[0] * 60;
    return (minutos - inicioMin);
  }

  duracionAPixels(duracion: number): number {
    return Math.max(duracion, 30);
  }

  get lineaAhora(): number {
    const hh = this.horaActual.getHours();
    const mm = this.horaActual.getMinutes();
    const minutos = hh * 60 + mm;
    const inicioMin = this.horasTimeline[0] * 60;
    return minutos - inicioMin;
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

  // ─── Acciones ─────────────────────────────────────────────
  abrirCompletar(cita: ICitaBarbero): void {
    this.citaSeleccionada = cita;
    this.modalCompletar = true;
  }

  abrirCancelar(cita: ICitaBarbero): void {
    this.citaSeleccionada = cita;
    this.modalCancelar = true;
  }

  completarCita(): void {
    if (!this.citaSeleccionada) return;
    this.procesando = true;
    this.agendaService.cambiarEstado(this.citaSeleccionada.id_reserva, 'completada').subscribe({
      next: () => {
        this.procesando = false;
        this.modalCompletar = false;
        this.citaSeleccionada = null;
        this.cargarDatos();
      },
      error: () => { this.procesando = false; this.error = 'Error al completar cita'; }
    });
  }

  cancelarCita(): void {
    if (!this.citaSeleccionada) return;
    this.procesando = true;
    this.agendaService.cambiarEstado(this.citaSeleccionada.id_reserva, 'cancelada').subscribe({
      next: () => {
        this.procesando = false;
        this.modalCancelar = false;
        this.citaSeleccionada = null;
        this.cargarDatos();
      },
      error: () => { this.procesando = false; this.error = 'Error al cancelar cita'; }
    });
  }

  // ─── Utils ────────────────────────────────────────────────
  formatHora(hora: string): string {
    if (!hora) return '';
    const [hh, mm] = hora.split(':').map(Number);
    const p = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2,'0')} ${p}`;
  }

  formatHoraNum(h: number): string {
    const p = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12} ${p}`;
  }

  formatFechaCorta(fecha: string): string {
    if (!fecha) return '';
    const parts = fecha.split('T')[0].split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${parseInt(parts[2])} ${meses[parseInt(parts[1])-1]}`;
  }

  formatFechaHoy(): string {
    const dias = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const hoy = new Date();
    return `${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;
  }

  get horaActualStr(): string {
    const hh = this.horaActual.getHours();
    const mm = this.horaActual.getMinutes();
    const p = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2,'0')} ${p}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}