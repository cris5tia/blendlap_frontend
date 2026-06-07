import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-footer *ngIf="mostrarFooter"></app-footer>
  `
})
export class PublicLayoutComponent {
  constructor(private router: Router) {}

  get mostrarFooter(): boolean {
    return this.router.url.split(/[?#]/)[0] !== '/agendar';
  }
}
