import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService, IUsuario } from '../../../core/services/auth.service';
import { ReservaService, IReserva } from '../../../core/services/reserva.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { CreditoService } from '../../../core/services/credito.service';
import { TabService } from '../../../core/services/tab.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  isScrolled = false;
  menuOpen = false;
  usuario: IUsuario | null = null;
  reservas: IReserva[] = [];
  cantidadCarrito = 0;
  creditosAprobados = 0;
  activeSection = '';
  private readonly publicSections = ['equipo', 'servicios', 'productos', 'galeria'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservaService: ReservaService,
    private creditoService: CreditoService,
    public carritoService: CarritoService,
    public tabService: TabService
  ) { }

  ngOnInit(): void {
    this.authService.usuario$.subscribe(u => {
      this.usuario = u;
      if (u?.rol === 'cliente') {
        this.cargarReservas();
        this.verificarCreditos();
      }
    });

    this.carritoService.items$.subscribe(items => {
      this.cantidadCarrito = items.reduce((sum, i) => sum + i.cantidad, 0);
    });

    this.router.events.subscribe(event => {
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
          r.estado === 'pendiente' || r.estado === 'confirmada'
        );
      },
      error: () => { }
    });
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
    this.carritoService.abrirModal();
  }

  logout(): void {
    this.authService.logout();
    this.carritoService.limpiar();
    this.closeMenu();
  }

  irADashboard(): void {
    const rol = this.authService.getRol();
    switch (rol) {
      case 'admin': this.router.navigate(['/admin/dashboard']); break;
      case 'barbero': this.router.navigate(['/barbero/agenda']); break;
      case 'cliente': this.router.navigate(['/cliente/dashboard']); break;
    }
    this.closeMenu();
  }

  irAgendarPresencial(): void {
    this.router.navigate(['/barbero/agenda'], { queryParams: { agendar: 'true' } });
    this.closeMenu();
  }

  get mostrarCarrito(): boolean {
    return !this.usuario || this.usuario.rol === 'cliente';
  }
  get esDashboardCliente(): boolean {
    return this.router.url.includes('/cliente/dashboard');
  }
}
