import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, IUsuario } from '../../../core/services/auth.service';
import { ReservaService, IReserva } from '../../../core/services/reserva.service';
import { CarritoService } from '../../../core/services/carrito.service';

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

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservaService: ReservaService,
    public carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    this.authService.usuario$.subscribe(u => {
      this.usuario = u;
      if (u?.rol === 'cliente') this.cargarReservas();
    });

    this.carritoService.items$.subscribe(items => {
      this.cantidadCarrito = items.reduce((sum, i) => sum + i.cantidad, 0);
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  cargarReservas(): void {
    if (this.usuario?.rol !== 'cliente') return;
    this.reservaService.getMisReservas().subscribe({
      next: (res) => {
        this.reservas = res.data.filter(r => r.estado === 'pendiente');
      },
      error: () => { }
    });
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }

  scrollTo(seccion: string): void {
    this.closeMenu();
    setTimeout(() => {
      const el = document.getElementById(seccion);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 100);
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
  }

  irAgendarPresencial(): void {
    this.router.navigate(['/barbero/agenda'], { queryParams: { agendar: 'true' } });
  }

  // Carrito visible solo si no es admin ni barbero
  get mostrarCarrito(): boolean {
    return !this.usuario || this.usuario.rol === 'cliente';
  }
}