import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { HorarioService, IHorarioDia, IExcepcion } from '../../../core/services/horario.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-horario',
  templateUrl: './horario.component.html',
  styleUrls: ['./horario.component.scss']
})
export class HorarioComponent implements OnInit {

  usuario: any = null;
  horarioBarberia: IHorarioDia[] = [];
  excepciones: IExcepcion[] = [];
  cargando = false;
  error = '';

  modalAgregar = false;
  modoEdicion = false;
  idExcepcionEditando: number | null = null;
  guardando = false;
  errorForm = '';

  confirmarEliminar = false;
  excepcionAEliminar: number | null = null;
  eliminando = false;

  readonly diaHoy = new Date().getDay();

  nuevaExcepcion = {
    dia_semana: 1,
    hora_inicio: '',
    hora_fin: '',
    motivo: ''
  };

  diasSemana = [
    { id: 0, nombre: 'Domingo',   abrev: 'Dom' },
    { id: 1, nombre: 'Lunes',     abrev: 'Lun' },
    { id: 2, nombre: 'Martes',    abrev: 'Mar' },
    { id: 3, nombre: 'Miércoles', abrev: 'Mié' },
    { id: 4, nombre: 'Jueves',    abrev: 'Jue' },
    { id: 5, nombre: 'Viernes',   abrev: 'Vie' },
    { id: 6, nombre: 'Sábado',    abrev: 'Sáb' }
  ];

  constructor(
    private authService: AuthService,
    private horarioService: HorarioService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.horarioService.getHorarioBarberia().subscribe({
      next: (res) => {
        this.horarioBarberia = res.data;
        this.cargando = false;
      },
      error: () => { this.error = 'Error al cargar horario'; this.cargando = false; }
    });
    this.cargarExcepciones();
  }

  cargarExcepciones(): void {
    this.horarioService.getMisExcepciones().subscribe({
      next: (res) => this.excepciones = res.data,
      error: () => {}
    });
  }

  get diasActivos(): number {
    return this.horarioBarberia.filter(d => d.activo).length;
  }

  get horasPorSemana(): number {
    return this.horarioBarberia.reduce((acc, d) => {
      if (!d.activo || !d.hora_inicio || !d.hora_fin) return acc;
      const [hh1, mm1] = d.hora_inicio.split(':').map(Number);
      const [hh2, mm2] = d.hora_fin.split(':').map(Number);
      return acc + ((hh2 * 60 + mm2) - (hh1 * 60 + mm1)) / 60;
    }, 0);
  }

  get horaDiaHoy(): IHorarioDia | undefined {
    return this.horarioBarberia.find(d => d.dia_semana === this.diaHoy);
  }

  getNombreDia(dia: number): string {
    return this.diasSemana.find(d => d.id === dia)?.nombre || '';
  }

  getAbrevDia(dia: number): string {
    return this.diasSemana.find(d => d.id === dia)?.abrev || '';
  }

  formatHora(hora: string): string {
    if (!hora) return '';
    const [hh, mm] = hora.split(':').map(Number);
    const p = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${p}`;
  }

  duracionHoras(inicio: string, fin: string): string {
    if (!inicio || !fin) return '';
    const [hh1, mm1] = inicio.split(':').map(Number);
    const [hh2, mm2] = fin.split(':').map(Number);
    const mins = (hh2 * 60 + mm2) - (hh1 * 60 + mm1);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  abrirModalAgregar(): void {
    this.modoEdicion = false;
    this.idExcepcionEditando = null;
    this.nuevaExcepcion = { dia_semana: 1, hora_inicio: '', hora_fin: '', motivo: '' };
    this.errorForm = '';
    this.modalAgregar = true;
  }

  abrirModalEditar(exc: IExcepcion): void {
    this.modoEdicion = true;
    this.idExcepcionEditando = exc.id_excepcion!;
    this.nuevaExcepcion = {
      dia_semana: exc.dia_semana,
      hora_inicio: exc.hora_inicio,
      hora_fin: exc.hora_fin,
      motivo: exc.motivo ?? ''
    };
    this.errorForm = '';
    this.modalAgregar = true;
  }

  cerrarModalAgregar(): void {
    this.modalAgregar = false;
    this.modoEdicion = false;
    this.idExcepcionEditando = null;
    this.errorForm = '';
  }

  guardarExcepcion(): void {
    if (!this.nuevaExcepcion.hora_inicio || !this.nuevaExcepcion.hora_fin) {
      this.errorForm = 'Completa hora inicio y hora fin';
      return;
    }
    if (this.nuevaExcepcion.hora_inicio >= this.nuevaExcepcion.hora_fin) {
      this.errorForm = 'La hora fin debe ser mayor a la hora inicio';
      return;
    }
    this.guardando = true;
    this.errorForm = '';

    const request$ = this.modoEdicion && this.idExcepcionEditando !== null
      ? this.horarioService.actualizarExcepcion(this.idExcepcionEditando, this.nuevaExcepcion)
      : this.horarioService.crearExcepcion(this.nuevaExcepcion);

    request$.subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModalAgregar();
        this.cargarExcepciones();
        this.toast.success(
          this.modoEdicion ? 'Descanso actualizado' : 'Descanso agregado',
          'El bloque de descanso fue guardado correctamente.'
        );
      },
      error: (err) => {
        this.errorForm = err.error?.mensaje || 'Error al guardar';
        this.guardando = false;
        this.toast.error('Error al guardar', err.error?.mensaje || 'Ocurrió un error inesperado.');
      }
    });
  }

  pedirConfirmarEliminar(id: number): void {
    this.excepcionAEliminar = id;
    this.confirmarEliminar = true;
  }

  cancelarEliminar(): void {
    this.confirmarEliminar = false;
    this.excepcionAEliminar = null;
  }

  confirmarEliminarExcepcion(): void {
    if (this.excepcionAEliminar === null) return;
    this.eliminando = true;
    this.horarioService.eliminarExcepcion(this.excepcionAEliminar).subscribe({
      next: () => {
        this.eliminando = false;
        this.cancelarEliminar();
        this.cargarExcepciones();
        this.toast.success('Descanso eliminado', 'El bloque de descanso fue eliminado correctamente.');
      },
      error: () => {
        this.eliminando = false;
        this.toast.error('Error al eliminar', 'No se pudo eliminar el descanso. Intentá de nuevo.');
      }
    });
  }

  excepcionesPorDia(dia: number): IExcepcion[] {
    return this.excepciones.filter(e => e.dia_semana === dia);
  }
}
