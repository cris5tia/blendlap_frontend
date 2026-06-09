import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  template: `
    <app-navbar *ngIf="mostrarNavbar"></app-navbar>
    <router-outlet></router-outlet>
    <app-footer *ngIf="mostrarFooter"></app-footer>
  `
})
export class PublicLayoutComponent {
  constructor(private router: Router) {}

  private get pathActual(): string {
    return this.router.url.split(/[?#]/)[0];
  }

  private get esPantallaCompleta(): boolean {
    return ['/checkout', '/login', '/registro', '/recuperar-password'].includes(this.pathActual);
  }

  get mostrarNavbar(): boolean {
    return !this.esPantallaCompleta;
  }

  get mostrarFooter(): boolean {
    const path = this.pathActual;
    return path !== '/agendar' && path !== '/nosotros' && !this.esPantallaCompleta;
  }
}
