import { Component } from '@angular/core';

@Component({
  selector: 'app-cliente-layout',
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-carrito-drawer></app-carrito-drawer>
  `
})
export class ClienteLayoutComponent {}