import { Component } from '@angular/core';

@Component({
  selector: 'app-cliente-layout',
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-chat-widget></app-chat-widget>
  `
})
export class ClienteLayoutComponent {}