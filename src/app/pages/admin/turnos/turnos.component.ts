import { Component, OnInit } from '@angular/core';
import { HorarioService, IHorarioDia, IExcepcion } from '../../../core/services/horario.service';

@Component({
  selector: 'app-turnos',
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.scss']
})
export class TurnosComponent implements OnInit {

  horario: IHorarioDia[] = [];
  cargando = false;
  guardando = false;
  error = '';
  exito = '';

  diasNombre = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  constructor(private horarioService: HorarioService) {}

  ngOnInit(): void {
    this.cargarHorario();
  }

  cargarHorario(): void {
    this.cargando = true;
    this.horarioService.getHorarioBarberia().subscribe({
      next: (res) => {
        this.horario = res.data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar el horario';
        this.cargando = false;
      }
    });
  }

  toggleDia(dia: IHorarioDia): void {
    dia.activo = dia.activo === 1 ? 0 : 1;
    this.guardarDia(dia);
  }

  guardarDia(dia: IHorarioDia): void {
    this.guardando = true;
    this.error = '';
    this.exito = '';

    this.horarioService.updateDia(dia.dia_semana, {
      hora_inicio: dia.hora_inicio,
      hora_fin: dia.hora_fin,
      activo: dia.activo
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.exito = 'Horario actualizado correctamente';
        setTimeout(() => this.exito = '', 3000);
      },
      error: () => {
        this.error = 'Error al guardar el horario';
        this.guardando = false;
      }
    });
  }

  guardarTodo(): void {
    this.guardando = true;
    this.error = '';
    this.exito = '';

    let pendientes = this.horario.length;
    let errores = 0;

    this.horario.forEach(dia => {
      this.horarioService.updateDia(dia.dia_semana, {
        hora_inicio: dia.hora_inicio,
        hora_fin: dia.hora_fin,
        activo: dia.activo
      }).subscribe({
        next: () => {
          pendientes--;
          if (pendientes === 0) {
            this.guardando = false;
            if (errores === 0) {
              this.exito = 'Horario guardado correctamente';
              setTimeout(() => this.exito = '', 3000);
            }
          }
        },
        error: () => {
          errores++;
          pendientes--;
          if (pendientes === 0) {
            this.guardando = false;
            this.error = 'Error al guardar algunos días';
          }
        }
      });
    });
  }

  getDiasActivos(): number {
    return this.horario.filter(d => d.activo === 1).length;
  }

  formatHora(hora: string): string {
    if (!hora) return '';
    const [hh, mm] = hora.split(':').map(Number);
    const periodo = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${periodo}`;
  }
}