import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, IUsuario } from '../../../core/services/auth.service';
import { ReservaService, IReserva } from '../../../core/services/reserva.service';

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

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservaService: ReservaService,
  ) { }

  ngOnInit(): void {
  this.authService.usuario$.subscribe(u => {
    this.usuario = u;
    if (u?.rol === 'cliente') this.cargarReservas();
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

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  scrollTo(seccion: string): void {
    this.closeMenu();
    setTimeout(() => {
      const elemento = document.getElementById(seccion);
      if (elemento) {
        const offset = 80;
        const top = elemento.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 100);
  }

  logout(): void {
    this.authService.logout();
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
  /* agenda cliente especial */
  irAgendarPresencial(): void {
    this.router.navigate(['/barbero/agenda'], { queryParams: { agendar: 'true' } });
  }
}