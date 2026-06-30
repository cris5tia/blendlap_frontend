import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HorarioService, IHorarioDia } from '../../../core/services/horario.service';
import { ToastService } from '../../../core/services/toast.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-turnos',
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.scss']
})
export class TurnosComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  horario: IHorarioDia[] = [];
  cargando = false;
  guardando = false;
  private guardadoTimers = new Map<number, ReturnType<typeof setTimeout>>();

  diasNombre = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  constructor(
    private horarioService: HorarioService,
    private toastService: ToastService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.cargarHorario();
    this.socketService.connect();
    this.socketService.onTurnoEvento()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarHorario());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.guardadoTimers.forEach(timer => clearTimeout(timer));
    this.guardadoTimers.clear();
  }

  cargarHorario(): void {
    this.cargando = true;
    this.horarioService.getHorarioBarberia().subscribe({
      next: (res) => {
        this.horario = res.data;
        this.cargando = false;
      },
      error: () => {
        this.toastService.error('Error al cargar el horario');
        this.cargando = false;
      }
    });
  }

  toggleDia(dia: IHorarioDia): void {
    this.cancelarGuardadoProgramado(dia.dia_semana);
    dia.activo = dia.activo === 1 ? 0 : 1;
    this.guardarDia(dia);
  }

  programarGuardarDia(dia: IHorarioDia): void {
    this.cancelarGuardadoProgramado(dia.dia_semana);

    const timer = setTimeout(() => {
      this.guardadoTimers.delete(dia.dia_semana);
      this.guardarDia(dia);
    }, 600);

    this.guardadoTimers.set(dia.dia_semana, timer);
  }

  guardarDia(dia: IHorarioDia): void {
    this.guardando = true;

    this.horarioService.updateDia(dia.dia_semana, {
      hora_inicio: dia.hora_inicio,
      hora_fin: dia.hora_fin,
      activo: dia.activo
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.toastService.success('Horario actualizado correctamente');
      },
      error: () => {
        this.toastService.error('Error al guardar el horario');
        this.guardando = false;
      }
    });
  }

  guardarTodo(): void {
    this.guardando = true;
    this.guardadoTimers.forEach(timer => clearTimeout(timer));
    this.guardadoTimers.clear();

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
              this.toastService.success('Horario guardado correctamente');
            }
          }
        },
        error: () => {
          errores++;
          pendientes--;
          if (pendientes === 0) {
            this.guardando = false;
            this.toastService.error('Error al guardar algunos días');
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

  private cancelarGuardadoProgramado(diaSemana: number): void {
    const timer = this.guardadoTimers.get(diaSemana);
    if (!timer) return;

    clearTimeout(timer);
    this.guardadoTimers.delete(diaSemana);
  }
}
