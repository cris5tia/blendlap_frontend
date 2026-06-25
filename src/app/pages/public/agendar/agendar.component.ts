import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, timeout, take } from 'rxjs/operators';
import { AuthService, IUsuario } from '../../../core/services/auth.service';
import { ServicioService, IServicio } from '../../../core/services/servicio.service';
import { ReservaService, IBarbero, ISlot } from '../../../core/services/reserva.service';
import { ToastService } from '../../../core/services/toast.service';

type Paso = 'servicio' | 'barbero' | 'fecha' | 'confirmacion';

@Component({
  selector: 'app-agendar',
  templateUrl: './agendar.component.html',
  styleUrls: ['./agendar.component.scss']
})
export class AgendarComponent implements OnInit, OnDestroy {

  private _pasoActual: Paso = 'servicio';
  get pasoActual(): Paso { return this._pasoActual; }
  set pasoActual(v: Paso) {
    this._pasoActual = v;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  barberoPreseleccionado = false;
  usuarioActual: IUsuario | null = null;

  // ── Auto-modal ───────────────────────────────────────────────
  autoModal = false;
  autoModalTipo: 'servicio' | 'barbero' | 'fecha' = 'servicio';

  get autoModalTitulo(): string {
    const s = this.serviciosSeleccionados[0];
    const b = this.barberoSeleccionado;
    if (this.autoModalTipo === 'servicio' && s) return s.nombre_servicio;
    if (this.autoModalTipo === 'barbero' && b) return `${b.nombre} ${b.apellido}`;
    if (this.autoModalTipo === 'fecha')
      return `${this.formatearFecha(this.fechaSeleccionada)} · ${this.formatearHora(this.horaSeleccionada)}`;
    return '';
  }

  get autoModalSubtitulo(): string {
    const s = this.serviciosSeleccionados[0];
    if (this.autoModalTipo === 'servicio' && s)
      return `$${Number(s.precio).toLocaleString('es-CO')} · ${s.duracion} min`;
    if (this.autoModalTipo === 'barbero')
      return this.barberoSeleccionado?.titulo || 'Barbero Profesional';
    if (this.autoModalTipo === 'fecha') return `Duración: ${this.duracionTotal} min`;
    return '';
  }

  onServicioClick(s: IServicio): void {
    const estaSeleccionado = this.isServicioSeleccionado(s);
    this.toggleServicio(s);
    if (!estaSeleccionado) { this.autoModalTipo = 'servicio'; this.autoModal = true; }
  }

  onBarberoClick(b: IBarbero): void {
    this.barberoSeleccionado = b;
    this.autoModalTipo = 'barbero';
    this.autoModal = true;
  }

  onSlotClick(hora: string): void {
    this.horaSeleccionada = hora;
    this.autoModalTipo = 'fecha';
    this.autoModal = true;
  }

  confirmarAutoModal(): void { this.autoModal = false; this.siguientePaso(); }
  cerrarAutoModal(): void    { this.autoModal = false; }

  // ── Modal planes ─────────────────────────────────────────────
  modalPlanes = false;
  mostrarModalPlanes = false;
  timerPlanes: any = null;

  get pasos(): Paso[] {
    return this.barberoPreseleccionado
      ? ['servicio', 'fecha', 'confirmacion']
      : ['servicio', 'barbero', 'fecha', 'confirmacion'];
  }

  servicios: IServicio[] = [];
  barberos: IBarbero[] = [];
  slots: ISlot[] = [];

  // Cache de categorías — se computa solo cuando cargan los servicios
  serviciosPorCategoria: { categoria: string; label: string; items: IServicio[] }[] = [];

  serviciosSeleccionados: IServicio[] = [];
  barberoSeleccionado: IBarbero | null = null;
  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';

  cargando       = false;
  cargandoInicio = true;
  cargandoSlots  = false;
  errorInicio = false;

  mesActual: Date = new Date();
  diasCalendario: { fecha: Date | null; disponible: boolean }[] = [];
  hoy: Date = new Date();
  horarioBarberia: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private servicioService: ServicioService,
    private reservaService: ReservaService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const usuarioCheck = this.authService.getUsuario();
    if (usuarioCheck?.rol === 'admin' || usuarioCheck?.rol === 'barbero') {
      this.toast.warning('Acción no disponible', 'El agendamiento de citas es exclusivo para clientes.');
      this.router.navigate([usuarioCheck.rol === 'admin' ? '/admin/dashboard' : '/barbero/agenda']);
      return;
    }

    try {
      const pendiente = sessionStorage.getItem('reserva_pendiente');
      if (pendiente) {
        const data = JSON.parse(pendiente);
        this.serviciosSeleccionados = data.servicios ?? [];
        this.barberoSeleccionado    = data.barbero   ?? null;
        this.fechaSeleccionada      = data.fecha     ?? '';
        this.horaSeleccionada       = data.hora      ?? '';
        this.pasoActual = 'confirmacion';
        sessionStorage.removeItem('reserva_pendiente');
      }
    } catch {
      sessionStorage.removeItem('reserva_pendiente');
    }

    const params = this.route.snapshot.queryParams;
    if (params['barbero']) this.barberoPreseleccionado = true;

    this.usuarioActual = this.authService.getUsuario();
    this.cargarServicios();
    this.cargarBarberos();
    this.cargarHorarioBarberia();
    this.mostrarModalPlanesInicio();

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(p => {
      if (p['barbero']) {
        const id = parseInt(p['barbero']);
        this.reservaService.getBarberos().pipe(take(1)).subscribe({
          next: (res: any) => {
            const b = res.data.find((x: any) => x.id_usuario === id);
            if (b) { this.barberoSeleccionado = b; this.barberoPreseleccionado = true; this.pasoActual = 'servicio'; }
          },
          error: () => {}
        });
      }
      if (p['servicio']) {
        const id = parseInt(p['servicio']);
        this.servicioService.getAll().pipe(take(1)).subscribe({
          next: (res: any) => {
            const s = res.data.find((x: any) => x.id_servicio === id);
            if (s) { this.serviciosSeleccionados = [s]; this.pasoActual = 'barbero'; }
          },
          error: () => {}
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerPlanes) { clearTimeout(this.timerPlanes); this.timerPlanes = null; }
    document.body.style.overflow = '';
  }

  cargarServicios(): void {
    this.cargandoInicio = true;
    this.errorInicio = false;
    this.servicioService.getAll({ activos: true })
      .pipe(timeout(8000), takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.servicios = res.data.sort((a, b) => Number(a.precio) - Number(b.precio));
          this.serviciosPorCategoria = [
            { id: 'premium',  label: 'Premium'   },
            { id: 'clasicos', label: 'Clásicos'  }
          ]
            .map(c => ({
              categoria: c.id,
              label: c.label,
              items: this.servicios.filter(s => s.categoria === c.id)
            }))
            .filter(c => c.items.length > 0);
          this.cargandoInicio = false;
        },
        error: () => {
          this.toast.error('Sin conexión', 'No se pudieron cargar los servicios. Verifica que el servidor esté activo.');
          this.errorInicio = true;
          this.cargandoInicio = false;
        }
      });
  }

  cargarBarberos(): void {
    this.reservaService.getBarberos()
      .pipe(timeout(8000), takeUntil(this.destroy$))
      .subscribe({
        next: (res) => { this.barberos = res.data; },
        error: () => {}
      });
  }

  toggleServicio(servicio: IServicio): void {
    const idx = this.serviciosSeleccionados.findIndex(s => s.id_servicio === servicio.id_servicio);
    this.serviciosSeleccionados = idx === -1 ? [servicio] : [];
  }

  isServicioSeleccionado(servicio: IServicio): boolean {
    return this.serviciosSeleccionados.some(s => s.id_servicio === servicio.id_servicio);
  }

  get duracionTotal(): number {
    return this.serviciosSeleccionados.reduce((sum, s) => sum + s.duracion, 0);
  }

  get precioTotal(): number {
    return this.serviciosSeleccionados.reduce((sum, s) => sum + Number(s.precio), 0);
  }

  cargarHorarioBarberia(): void {
    this.reservaService.getHorarioBarberia()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: { ok: boolean; data: any[] }) => {
          this.horarioBarberia = res.data;
          this.generarCalendario();
        },
        error: () => { this.generarCalendario(); }
      });
  }

  esDiaAbierto(fecha: Date): boolean {
    if (this.horarioBarberia.length === 0) return true;
    const horario = this.horarioBarberia.find((h: any) => h.dia_semana === fecha.getDay());
    return horario ? horario.activo === 1 : false;
  }

  generarCalendario(): void {
    const año = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    const primerDia = new Date(año, mes, 1).getDay();
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    this.diasCalendario = [];
    for (let i = 0; i < primerDia; i++) {
      this.diasCalendario.push({ fecha: null, disponible: false });
    }
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = new Date(año, mes, d);
      const pasado = fecha < new Date(this.hoy.getFullYear(), this.hoy.getMonth(), this.hoy.getDate());
      this.diasCalendario.push({ fecha, disponible: !pasado && this.esDiaAbierto(fecha) });
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
    this.fechaSeleccionada = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
    this.horaSeleccionada = '';
    this.cargarSlots();
  }

  esDiaSeleccionado(dia: { fecha: Date | null }): boolean {
    if (!dia.fecha || !this.fechaSeleccionada) return false;
    const f = dia.fecha;
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}` === this.fechaSeleccionada;
  }

  esDiaCerrado(dia: { fecha: Date | null; disponible: boolean }): boolean {
    if (!dia.fecha || this.horarioBarberia.length === 0) return false;
    const horario = this.horarioBarberia.find((h: any) => h.dia_semana === dia.fecha!.getDay());
    return horario ? horario.activo === 0 : true;
  }

  cargarSlots(): void {
    if (!this.barberoSeleccionado || !this.fechaSeleccionada) return;
    this.cargandoSlots = true;
    this.reservaService.getDisponibilidad(
      this.barberoSeleccionado.id_usuario,
      this.fechaSeleccionada,
      this.duracionTotal || 30
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        let slots: ISlot[] = res.data.disponible ? res.data.slots : [];
        const ahora = new Date();
        const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
        if (this.fechaSeleccionada === hoyStr) {
          const minutoMinimo = ahora.getHours() * 60 + ahora.getMinutes() + 15;
          slots = slots.filter(slot => {
            const [hh, mm] = slot.hora.split(':').map(Number);
            return (hh * 60 + mm) >= minutoMinimo;
          });
        }
        this.slots = slots;
        this.cargandoSlots = false;
      },
      error: () => {
        this.toast.error('Error', 'No se pudo cargar la disponibilidad');
        this.cargandoSlots = false;
      }
    });
  }

  get pasoIndex(): number { return this.pasos.indexOf(this.pasoActual); }

  siguientePaso(): void {
    const idx = this.pasoIndex;
    if (idx < this.pasos.length - 1) {
      this.pasoActual = this.pasos[idx + 1];
      if (this.pasoActual === 'fecha') this.cargarSlots();
    }
  }

  pasoAnterior(): void {
    const idx = this.pasoIndex;
    if (idx > 0) this.pasoActual = this.pasos[idx - 1];
  }

  puedeAvanzar(): boolean {
    switch (this.pasoActual) {
      case 'servicio': return this.serviciosSeleccionados.length > 0;
      case 'barbero':  return !!this.barberoSeleccionado;
      case 'fecha':    return !!this.fechaSeleccionada && !!this.horaSeleccionada;
      default:         return false;
    }
  }

  confirmarReserva(): void {
    if (!this.authService.isLoggedIn()) {
      sessionStorage.setItem('reserva_pendiente', JSON.stringify({
        servicios: this.serviciosSeleccionados,
        barbero:   this.barberoSeleccionado,
        fecha:     this.fechaSeleccionada,
        hora:      this.horaSeleccionada
      }));
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/agendar' } });
      return;
    }

    const usuario = this.authService.getUsuario();
    if (!usuario) return;

    this.cargando = true;

    this.reservaService.crear({
      id_cliente: usuario.id_usuario,
      id_barbero: this.barberoSeleccionado!.id_usuario,
      fecha:      this.fechaSeleccionada,
      hora:       this.horaSeleccionada,
      servicios:  this.serviciosSeleccionados.map(s => s.id_servicio!)
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.toast.success('¡Reserva confirmada!', 'Tu cita ha sido agendada correctamente.');
        this.router.navigate(['/cliente/mis-citas']);
      },
      error: (err) => {
        this.toast.error('No se pudo confirmar', err.error?.mensaje || 'Error al crear la reserva');
        this.cargando = false;
      }
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const [año, mes, dia] = fecha.split('-');
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${año}`;
  }

  formatearHora(hora: string): string {
    if (!hora) return '';
    const [hh, mm] = hora.split(':').map(Number);
    const periodo = hh >= 12 ? 'PM' : 'AM';
    return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${periodo}`;
  }

  irAlHome(): void { this.router.navigate(['/']); }

  mostrarModalPlanesInicio(): void {
    this.modalPlanes = true;
    setTimeout(() => { this.mostrarModalPlanes = true; }, 50);
    document.body.style.overflow = 'hidden';
    this.timerPlanes = setTimeout(() => { this.cerrarModalPlanes(); }, 25000);
  }

  cerrarModalPlanes(): void {
    if (this.timerPlanes) { clearTimeout(this.timerPlanes); this.timerPlanes = null; }
    this.mostrarModalPlanes = false;
    setTimeout(() => { this.modalPlanes = false; document.body.style.overflow = ''; }, 400);
  }
}
