import { Component, OnInit, HostListener } from '@angular/core';
import { AuthService, IUsuario } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {

  sidebarCollapsed = false;
  sidebarOpen = false;
  usuario: IUsuario | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    if (window.innerWidth <= 920) {
      this.sidebarCollapsed = true;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 920) {
      this.sidebarOpen = false;
    }
  }

  toggleSidebar(): void {
    if (window.innerWidth <= 920) {
      this.sidebarOpen = !this.sidebarOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
