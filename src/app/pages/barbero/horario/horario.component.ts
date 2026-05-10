import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { HorarioService, IHorarioDia, IExcepcion } from '../../../core/services/horario.service';

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
  guardando = false;
  errorForm = '';

  nuevaExcepcion = {
    dia_semana: 1,
    hora_inicio: '',
    hora_fin: '',
    motivo: ''
  };

  diasSemana = [
    { id: 0, nombre: 'Domingo' },
    { id: 1, nombre: 'Lunes' },
    { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miercoles' },
    { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' },
    { id: 6, nombre: 'Sabado' }
  ];

  constructor(
    private authService: AuthService,
    private horarioService: HorarioService
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

  getNombreDia(dia: number): string {
    return this.diasSemana.find(d => d.id === dia)?.nombre || '';
  }

  formatHora(hora: string): string {
    if (!hora) return '';
    const [hh, mm] = hora.split(':').map(Number);
    const p = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2,'0')} ${p}`;
  }

  abrirModalAgregar(): void {
    this.nuevaExcepcion = { dia_semana: 1, hora_inicio: '', hora_fin: '', motivo: '' };
    this.errorForm = '';
    this.modalAgregar = true;
  }

  cerrarModalAgregar(): void {
    this.modalAgregar = false;
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
    this.horarioService.crearExcepcion(this.nuevaExcepcion).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModalAgregar();
        this.cargarExcepciones();
      },
      error: (err) => {
        this.errorForm = err.error?.mensaje || 'Error al guardar';
        this.guardando = false;
      }
    });
  }

  eliminarExcepcion(id: number): void {
    this.horarioService.eliminarExcepcion(id).subscribe({
      next: () => this.cargarExcepciones(),
      error: () => this.error = 'Error al eliminar'
    });
  }

  excepcionesPorDia(dia: number): IExcepcion[] {
    return this.excepciones.filter(e => e.dia_semana === dia);
  }
}