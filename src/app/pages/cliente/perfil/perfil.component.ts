import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CreditoService, ICredito } from '../../../core/services/credito.service';
import { PagoService, ICompra } from '../../../core/services/pago.service';
import { ReservaService, IReserva } from '../../../core/services/reserva.service';

export type PerfilTab = 'overview' | 'editar' | 'creditos' | 'compras';
export type Tier = 'nuevo' | 'bronce' | 'plata' | 'oro' | 'legendario';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {

  tab: PerfilTab = 'overview';

  modalCompras  = false;
  modalCreditos = false;

  usuario: any = null;
  perfilNombre = '';
  perfilApellido = '';
  perfilTelefono = '';
  perfilCorreo = '';
  perfilFotoActual = '';
  perfilFotoFile: File | null = null;
  perfilFotoPreview = '';
  perfilEliminarFoto = false;
  perfilGuardando = false;
  perfilError = '';
  perfilExito = false;
  perfilCargando = true;

  creditos: ICredito[] = [];
  cargandoCreditos = false;

  compras: ICompra[] = [];
  cargandoCompras = false;

  reservas: IReserva[] = [];
  cargandoReservas = false;

  constructor(
    private authService: AuthService,
    private creditoService: CreditoService,
    private pagoService: PagoService,
    private reservaService: ReservaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();

    this.route.queryParams.subscribe(params => {
      const t = params['tab'] as PerfilTab;
      this.tab = ['editar', 'creditos', 'compras'].includes(t) ? t : 'overview';
    });

    this.cargarPerfil();
    this.cargarCreditos();
    this.cargarCompras();
    this.cargarReservas();
  }

  setTab(t: PerfilTab): void { this.tab = t; }

  irACitas():  void { this.router.navigate(['/cliente/mis-citas']); }
  irAlInicio(): void { this.router.navigate(['/']); }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  abrirModalCompras():  void { this.modalCompras  = true; }
  cerrarModalCompras(): void { this.modalCompras  = false; }
  abrirModalCreditos(): void { this.modalCreditos = true; }
  cerrarModalCreditos():void { this.modalCreditos = false; }

  cargarPerfil(): void {
    this.perfilCargando = true;
    this.authService.obtenerMiPerfil().subscribe({
      next: (res) => {
        this.perfilNombre    = res.data.nombre;
        this.perfilApellido  = res.data.apellido;
        this.perfilTelefono  = res.data.telefono || '';
        this.perfilCorreo    = res.data.correo_electronico;
        this.perfilFotoActual = res.data.foto || '';
        this.perfilCargando  = false;
        this.authService.actualizarUsuarioLocal(res.data);
      },
      error: () => {
        this.perfilNombre   = this.usuario?.nombre || '';
        this.perfilApellido = this.usuario?.apellido || '';
        this.perfilCorreo   = this.usuario?.correo_electronico || '';
        this.perfilCargando = false;
      }
    });
  }

  cargarCreditos(): void {
    this.cargandoCreditos = true;
    this.creditoService.getMisCreditos().subscribe({
      next: (res) => { this.creditos = res.data; this.cargandoCreditos = false; },
      error: () => { this.cargandoCreditos = false; }
    });
  }

  cargarCompras(): void {
    this.cargandoCompras = true;
    this.pagoService.getMisCompras().subscribe({
      next: (res) => {
        this.compras = res.data.map(c => ({
          ...c,
          items: typeof c.items === 'string' ? JSON.parse(c.items) : c.items
        }));
        this.cargandoCompras = false;
      },
      error: () => { this.cargandoCompras = false; }
    });
  }

  cargarReservas(): void {
    this.cargandoReservas = true;
    this.reservaService.getMisReservas().subscribe({
      next: (res) => { this.reservas = res.data; this.cargandoReservas = false; },
      error: () => { this.cargandoReservas = false; }
    });
  }

  private esReservaPasada(r: IReserva): boolean {
    const fecha = r.fecha.split('T')[0];
    const [hh, mm] = (r.hora || '00:00').split(':').map(Number);
    const finMin  = hh * 60 + mm + (Number(r.duracion_total) || 30);
    const fechaFin = new Date(
      `${fecha}T${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}:00`
    );
    return fechaFin < new Date();
  }

  get reservasProximas(): IReserva[] {
    return this.reservas
      .filter(r => (r.estado === 'pendiente' || r.estado === 'confirmada') && !this.esReservaPasada(r))
      .slice(0, 3);
  }

  get citasCompletadas(): number {
    return this.reservas.filter(r => r.estado === 'completada').length;
  }

  get creditosActivos(): number {
    return this.creditos.filter(c => c.estado === 'activo').length;
  }

  get comprasRecientes(): ICompra[] { return this.compras.slice(0, 3); }

  get historialCitas(): IReserva[] {
    return this.reservas
      .filter(r => r.estado === 'completada' || r.estado === 'cancelada')
      .slice(0, 3);
  }

  get tier(): Tier {
    const n = this.citasCompletadas;
    if (n >= 50) return 'legendario';
    if (n >= 30) return 'oro';
    if (n >= 20) return 'plata';
    if (n >= 10) return 'bronce';
    return 'nuevo';
  }

  get tierLabel(): string {
    return {
      nuevo: 'Nuevo', bronce: 'Bronce', plata: 'Plata',
      oro: 'Oro', legendario: 'Fiel Legendario'
    }[this.tier];
  }

  get tierIcon(): string {
    return {
      nuevo: 'fa-user', bronce: 'fa-cut', plata: 'fa-spa',
      oro: 'fa-crown', legendario: 'fa-star'
    }[this.tier];
  }

  get tierProgress(): number {
    const n = this.citasCompletadas;
    if (this.tier === 'nuevo')   return Math.min((n / 10) * 100, 100);
    if (this.tier === 'bronce')  return Math.min(((n - 10) / 10) * 100, 100);
    if (this.tier === 'plata')   return Math.min(((n - 20) / 10) * 100, 100);
    if (this.tier === 'oro')     return Math.min(((n - 30) / 20) * 100, 100);
    return 100;
  }

  get tierProximoLabel(): string {
    const n = this.citasCompletadas;
    if (this.tier === 'nuevo')  { const r = 10 - n; return `${r} cita${r !== 1 ? 's' : ''} para Bronce`; }
    if (this.tier === 'bronce') { const r = 20 - n; return `${r} cita${r !== 1 ? 's' : ''} para Plata`; }
    if (this.tier === 'plata')  { const r = 30 - n; return `${r} cita${r !== 1 ? 's' : ''} para Oro`; }
    if (this.tier === 'oro')    { const r = 50 - n; return `${r} cita${r !== 1 ? 's' : ''} para Fiel Legendario`; }
    return 'Nivel máximo alcanzado';
  }

  get clienteId(): string {
    const id = this.usuario?.id_usuario || this.usuario?.id || '';
    return id ? `#CLT-${String(id).padStart(4, '0')}` : '';
  }

  get memberDesde(): string {
    const fecha = this.usuario?.fecha_registro || this.usuario?.createdAt;
    if (!fecha) return '';
    const d = new Date(fecha);
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${m[d.getMonth()]} ${d.getFullYear()}`;
  }

  onFotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.perfilFotoFile    = input.files[0];
    this.perfilEliminarFoto = false;
    const reader = new FileReader();
    reader.onload = (e) => { this.perfilFotoPreview = e.target?.result as string; };
    reader.readAsDataURL(this.perfilFotoFile);
  }

  quitarFoto(): void {
    this.perfilFotoPreview  = '';
    this.perfilFotoFile     = null;
    this.perfilFotoActual   = '';
    this.perfilEliminarFoto = true;
  }

  guardarPerfil(): void {
    if (!this.perfilNombre.trim() || !this.perfilApellido.trim()) {
      this.perfilError = 'Nombre y apellido son obligatorios';
      return;
    }
    this.perfilGuardando = true;
    this.perfilError     = '';
    const fd = new FormData();
    fd.append('nombre',   this.perfilNombre.trim());
    fd.append('apellido', this.perfilApellido.trim());
    fd.append('telefono', this.perfilTelefono.trim());
    if (this.perfilEliminarFoto) fd.append('eliminarFoto', 'true');
    if (this.perfilFotoFile)     fd.append('foto', this.perfilFotoFile);
    this.authService.actualizarMiPerfil(fd).subscribe({
      next: (res) => {
        this.perfilGuardando  = false;
        this.perfilExito      = true;
        this.perfilFotoActual = res.data.foto || '';
        this.perfilFotoPreview = '';
        this.perfilFotoFile   = null;
        this.authService.actualizarUsuarioLocal(res.data);
        setTimeout(() => { this.perfilExito = false; }, 3000);
      },
      error: (err) => {
        this.perfilGuardando = false;
        this.perfilError     = err.error?.mensaje || 'Error al guardar los cambios';
      }
    });
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v || 0);
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const [y, m, d] = fecha.split('T')[0].split('-');
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`;
  }

  formatFechaCorta(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha.split('T')[0] + 'T12:00:00');
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${m[d.getMonth()]}`;
  }

  formatDiaMes(fecha: string): { dia: string; mes: string } {
    if (!fecha) return { dia: '--', mes: '---' };
    const d = new Date(fecha.split('T')[0] + 'T12:00:00');
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return { dia: String(d.getDate()), mes: m[d.getMonth()] };
  }

  formatHora(hora: string): string {
    if (!hora) return '';
    const [hh, mm] = hora.split(':').map(Number);
    const p = hh >= 12 ? 'PM' : 'AM';
    return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${p}`;
  }

  estadoCitaLabel(estado: string): string {
    const m: Record<string, string> = {
      pendiente: 'Pendiente', confirmada: 'Confirmada',
      completada: 'Completada', cancelada: 'Cancelada'
    };
    return m[estado] || estado;
  }
}
