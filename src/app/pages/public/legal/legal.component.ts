import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CONTENIDO_LEGAL, FECHA_ACTUALIZACION, IContenidoLegal, ORDEN_LEGAL } from './legal-content';

@Component({
  selector: 'app-legal',
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.scss'
})
export class LegalComponent implements OnInit {

  contenido!: IContenidoLegal;
  otrosDocumentos: { tipo: string; titulo: string }[] = [];
  fechaActualizacion = FECHA_ACTUALIZACION;
  mostrarScrollTop = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    const tipo = this.activatedRoute.snapshot.data['tipo'] as string;
    this.contenido = CONTENIDO_LEGAL[tipo];
    this.otrosDocumentos = ORDEN_LEGAL
      .filter(t => t !== tipo)
      .map(t => ({ tipo: t, titulo: CONTENIDO_LEGAL[t].titulo }));
    window.scrollTo({ top: 0 });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.mostrarScrollTop = window.scrollY > 400;
  }

  scrollAlTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volver(): void {
    this.location.back();
  }
}
