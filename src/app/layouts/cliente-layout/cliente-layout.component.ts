import { Component } from '@angular/core';

@Component({
  selector: 'app-cliente-layout',
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
  `
})
export class ClienteLayoutComponent {}