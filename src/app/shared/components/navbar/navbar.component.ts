import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService, IUsuario } from '../../../core/services/auth.service';
import { ReservaService, IReserva } from '../../../core/services/reserva.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { CreditoService } from '../../../core/services/credito.service';
import { TabService } from '../../../core/services/tab.service';
import { BarberoPresencialModalService } from '../../../core/services/barbero-presencial-modal.service';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  isScrolled = false;
  menuOpen = false;
  usuario: IUsuario | null = null;
  reservas: IReserva[] = [];
  cantidadCarrito = 0;
  creditosAprobados = 0;
  activeSection = '';
  tabActualCliente = 'actuales';
  private readonly publicSections = ['equipo', 'servicios', 'productos', 'galeria'];

  // Dropdown usuario
  dropdownOpen = false;

  // Modal logout
  logoutCerrando = false;
  logoutExitoso  = false;

  // Modal carrito
  modalCarritoAbierto = false;
  itemsCarrito: any[] = [];
  plazoSeleccionado = '1_quincena';
  enviandoCredito  = false;
  exitoCredito     = false;
  errorCredito     = '';
  plazos = [
    { id: '1_semana',    label: '1 Semana',    desc: '7 días'  },
    { id: '1_quincena',  label: '1 Quincena',  desc: '15 días' },
    { id: '2_quincenas', label: '2 Quincenas', desc: '30 días' },
    { id: '1_mes',       label: '1 Mes',       desc: '1 mes'   }
  ];

  // Modal perfil (solo para barbero/admin)
  modalPerfil = false;
  perfilCargando = false;
  perfilGuardando = false;
  perfilError = '';
  perfilExito = false;
  perfilNombre = '';
  perfilApellido = '';
  perfilTelefono = '';
  perfilCorreo = '';
  perfilFotoActual = '';
  perfilFotoFile: File | null = null;
  perfilFotoPreview = '';
  perfilEliminarFoto = false;

  readonly API_IMG = `${environment.apiUrl.replace(/\/api\/?$/, '/images')}/clientes/`;

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservaService: ReservaService,
    private creditoService: CreditoService,
    private barberoPresencialModal: BarberoPresencialModalService,

    public carritoService: CarritoService,
    public tabService: TabService
  ) { }

  ngOnInit(): void {
    this.authService.logoutRequested$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.logout();
    });

    this.authService.usuario$.pipe(
      distinctUntilChanged((a, b) => a?.id_usuario === b?.id_usuario && a?.rol === b?.rol),
      takeUntil(this.destroy$)
    ).subscribe(u => {
      this.usuario = u;
      if (u?.rol === 'cliente') {
        this.cargarReservas();
        // El badge de créditos no se muestra en el dashboard → carga solo fuera de él
        if (!this.esDashboardCliente) {
          this.verificarCreditos();
        }
      }
    });

    this.carritoService.items$.pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.cantidadCarrito = items.length;
      this.itemsCarrito = items;
    });

    this.carritoService.modal$.pipe(takeUntil(this.destroy$)).subscribe(abierto => {
      this.modalCarritoAbierto = abierto;
    });

    this.tabService.tab$.pipe(takeUntil(this.destroy$)).subscribe(tab => {
      this.tabActualCliente = tab;
    });

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.router.url.startsWith('/#')) {
          this.router.navigateByUrl('/', { replaceUrl: true });
          window.scrollTo({ top: 0 });
          return;
        }
        setTimeout(() => this.updateActiveSection(), 0);
      }
    });

    setTimeout(() => this.updateActiveSection(), 0);
  }
  get esHome(): boolean {
    return this.router.url.split(/[?#]/)[0] === '/';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
    this.updateActiveSection();
  }

  cargarReservas(): void {
    if (this.usuario?.rol !== 'cliente') return;
    this.reservaService.getMisReservas().subscribe({
      next: (res) => {
        this.reservas = res.data.filter(r =>
          (r.estado === 'pendiente' || r.estado === 'confirmada') && this.esReservaActual(r)
        );
      },
      error: () => { }
    });
  }

  private esReservaActual(reserva: IReserva): boolean {
    const fecha = reserva.fecha.split('T')[0];
    const [hh, mm] = (reserva.hora || '00:00').split(':').map(Number);
    const finMin = hh * 60 + mm + (Number(reserva.duracion_total) || 30);
    const finHh = Math.floor(finMin / 60);
    const finMm = finMin % 60;
    const fechaFin = new Date(`${fecha}T${String(finHh).padStart(2, '0')}:${String(finMm).padStart(2, '0')}:00`);
    return fechaFin >= new Date();
  }

  verificarCreditos(): void {
    this.creditoService.getMisCreditos().subscribe({
      next: (res) => {
        this.creditosAprobados = res.data.filter(
          (c: any) => c.estado === 'aprobado'
        ).length;
      },
      error: () => { }
    });
  }
  tabCliente(tab: string): void {
    this.tabService.cambiarTab(tab);
    this.closeMenu();
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }

  scrollTo(seccion: string): void {
    this.closeMenu();
    this.activeSection = seccion;
    if (!this.esHome) {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.scrollToSection(seccion), 120);
      });
      return;
    }
    setTimeout(() => this.scrollToSection(seccion), 100);
  }

  private scrollToSection(seccion: string): void {
    const el = document.getElementById(seccion);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  private updateActiveSection(): void {
    if (!this.esHome) {
      this.activeSection = '';
      return;
    }

    const triggerY = window.innerHeight * 0.38;
    let current = '';

    for (const section of this.publicSections) {
      const el = document.getElementById(section);
      if (!el || el.offsetParent === null) continue;

      const rect = el.getBoundingClientRect();
      if (rect.top <= triggerY && rect.bottom > triggerY) {
        current = section;
        break;
      }
    }

    this.activeSection = current;
  }

  irAlCarrito(): void {
    this.closeMenu();
    this.carritoService.toggleModal();
  }

  // ─── Modal Carrito ─────────────────────────────────────────
  get totalCarrito(): number { return this.carritoService.total; }

  getImagenCarrito(imagen?: string): string {
    if (!imagen) return 'assets/images/no-img.png';
    if (imagen.startsWith('data:') || imagen.startsWith('http') || imagen.startsWith('assets/')) return imagen;
    return `${environment.apiUrl.replace(/\/api\/?$/, '/images')}/productos/${imagen}`;
  }

  aumentarItemCarrito(id: number): void {
    const item = this.itemsCarrito.find((i: any) => i.producto.id_producto === id);
    if (!item) return;
    this.carritoService.cambiarCantidad(id, item.cantidad + 1);
  }

  disminuirItemCarrito(id: number): void {
    const item = this.itemsCarrito.find((i: any) => i.producto.id_producto === id);
    if (!item) return;
    this.carritoService.cambiarCantidad(id, item.cantidad - 1);
  }

  quitarItemCarrito(id: number): void { this.carritoService.quitar(id); }

  limpiarCarrito(): void { this.carritoService.limpiar(); }

  irAlCheckout(): void {
    this.carritoService.cerrarModal();
    this.router.navigate(['/checkout']);
  }

  solicitarCreditoCarrito(): void {
    if (!this.itemsCarrito.length) return;
    this.enviandoCredito = true;
    this.errorCredito    = '';
    const data = {
      plazo: this.plazoSeleccionado,
      productos: this.itemsCarrito.map((i: any) => ({
        id_producto:     i.producto.id_producto,
        cantidad:        i.cantidad,
        talla:           i.talla || null,
        precio_unitario: Number(i.producto.precio),
        subtotal:        Number(i.producto.precio) * i.cantidad
      }))
    };
    this.creditoService.solicitarCredito(data).subscribe({
      next: () => {
        this.enviandoCredito = false;
        this.exitoCredito = true;
        this.carritoService.limpiar();
        setTimeout(() => {
          this.cerrarModalCarrito();
          this.router.navigate(['/']);
        }, 5000);
      },
      error: (err: any) => {
        this.errorCredito = err.error?.mensaje || 'Error al enviar la solicitud';
        this.enviandoCredito = false;
      }
    });
  }

  cerrarModalCarrito(): void {
    this.carritoService.cerrarModal();
    this.exitoCredito = false;
    this.errorCredito = '';
  }

  logout(): void {
    this.closeMenu();
    this.dropdownOpen = false;
    this.carritoService.limpiar();
    this.authService.logout();
  }

  irADashboard(): void {
    const rol = this.authService.getRol();
    switch (rol) {
      case 'admin': this.router.navigate(['/admin/dashboard']); break;
      case 'barbero': this.router.navigate(['/barbero/agenda']); break;
      case 'cliente': this.router.navigate(['/cliente/mis-citas']); break;
    }
    this.closeMenu();
  }

  irAgendarPresencial(): void {
    this.closeMenu();
    this.barberoPresencialModal.abrir();
  }

  get mostrarCarrito(): boolean {
    return !this.usuario || this.usuario.rol === 'cliente';
  }

  get mostrarBottomNav(): boolean {
    return !this.usuario || this.usuario.rol === 'cliente' || this.usuario.rol === 'barbero';
  }

  get esDashboardCliente(): boolean {
    return this.router.url.includes('/cliente/mis-citas');
  }

  irAlInicio(): void {
    this.router.navigate(['/']);
    this.closeMenu();
  }

  get esPerfilCliente(): boolean {
    return this.router.url.startsWith('/cliente/perfil');
  }

  // ─── Dropdown ─────────────────────────────────────────────
  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click')
  cerrarDropdown(): void {
    this.dropdownOpen = false;
  }

  irAPerfil(tab?: string): void {
    this.dropdownOpen = false;
    this.closeMenu();
    this.router.navigate(['/cliente/perfil'], tab ? { queryParams: { tab } } : {});
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v || 0);
  }

  formatFechaCorta2(fecha: string): string {
    if (!fecha) return '';
    const [y, m, d] = fecha.split('T')[0].split('-');
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`;
  }

  // ─── Modal Perfil ─────────────────────────────────────────
  abrirModalPerfil(): void {
    this.dropdownOpen = false;
    this.closeMenu();
    this.perfilCargando = true;
    this.perfilError = '';
    this.perfilExito = false;
    this.perfilFotoFile = null;
    this.perfilFotoPreview = '';
    this.perfilEliminarFoto = false;
    this.modalPerfil = true;
    this.authService.obtenerMiPerfil().subscribe({
      next: (res) => {
        this.perfilNombre = res.data.nombre;
        this.perfilApellido = res.data.apellido;
        this.perfilTelefono = res.data.telefono || '';
        this.perfilCorreo = res.data.correo_electronico;
        this.perfilFotoActual = res.data.foto || '';
        this.perfilCargando = false;
        this.authService.actualizarUsuarioLocal(res.data);
      },
      error: () => {
        this.perfilNombre = this.usuario?.nombre || '';
        this.perfilApellido = this.usuario?.apellido || '';
        this.perfilCorreo = this.usuario?.correo_electronico || '';
        this.perfilTelefono = '';
        this.perfilFotoActual = '';
        this.perfilCargando = false;
      }
    });
  }

  cerrarModalPerfil(): void {
    this.modalPerfil = false;
  }

  onFotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.perfilFotoFile = file;
    this.perfilEliminarFoto = false;
    const reader = new FileReader();
    reader.onload = (e) => { this.perfilFotoPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  quitarFoto(): void {
    this.perfilFotoPreview = '';
    this.perfilFotoFile = null;
    this.perfilFotoActual = '';
    this.perfilEliminarFoto = true;
  }

  guardarPerfil(): void {
    if (!this.perfilNombre.trim() || !this.perfilApellido.trim()) {
      this.perfilError = 'Nombre y apellido son obligatorios';
      return;
    }
    this.perfilGuardando = true;
    this.perfilError = '';
    const fd = new FormData();
    fd.append('nombre', this.perfilNombre.trim());
    fd.append('apellido', this.perfilApellido.trim());
    fd.append('telefono', this.perfilTelefono.trim());
    if (this.perfilEliminarFoto) fd.append('eliminarFoto', 'true');
    if (this.perfilFotoFile) fd.append('foto', this.perfilFotoFile);
    this.authService.actualizarMiPerfil(fd).subscribe({
      next: (res) => {
        this.perfilGuardando = false;
        this.perfilExito = true;
        this.perfilFotoActual = res.data.foto || '';
        this.perfilFotoPreview = '';
        this.perfilFotoFile = null;
        this.authService.actualizarUsuarioLocal(res.data);
        setTimeout(() => {
          this.perfilExito = false;
          this.cerrarModalPerfil();
        }, 1800);
      },
      error: (err) => {
        this.perfilGuardando = false;
        this.perfilError = err.error?.mensaje || 'Error al guardar los cambios';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
