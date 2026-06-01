import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-historia',
  templateUrl: './historia.component.html',
  styleUrl: './historia.component.scss'
})
export class HistoriaComponent {

  mostrarScrollTop = false;
  activeSection    = '';

  @HostListener('window:scroll')
  onScroll(): void {
    this.mostrarScrollTop = window.scrollY > 400;
    this.detectarSeccion();
  }

  private detectarSeccion(): void {
    const secciones = ['historia', 'mision', 'valores', 'trabaja'];
    for (const id of [...secciones].reverse()) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 100) {
        this.activeSection = id;
        return;
      }
    }
    this.activeSection = '';
  }

  scrollAlTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
