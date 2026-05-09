import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ServicioService, IServicio } from '../../../core/services/servicio.service';
import { BarberoService, IBarbero } from '../../../core/services/barbero.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  @ViewChild('galeriaTrack') galeriaTrack!: ElementRef;

  constructor(
    private servicioService: ServicioService,
    private barberoService: BarberoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.galeriaVisible = this.esMobil() ? 6 : 6;
    this.cargarServicios();
    this.cargarBarberos();
  }

  scrollTo(seccion: string): void {
    const elemento = document.getElementById(seccion);
    if (elemento) {
      const offset = 80;
      const top = elemento.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  esMobil(): boolean {
    return window.innerWidth <= 768;
  }

  // ─── Servicios ────────────────────────────────────────────
  servicios: IServicio[] = [];
  grupoActual = 0;
  categoriaActivaServicio = 'cortes';

  categoriasServicio = [
    { id: 'cortes', nombre: 'Cortes', icon: '✂️' },
    { id: 'barba', nombre: 'Barba & Cejas', icon: '🧔' },
    { id: 'combos', nombre: 'Combos', icon: '🔥' },
    { id: 'premium', nombre: 'Premium', icon: '✨' }
  ];

  cargarServicios(): void {
    this.servicioService.getAll().subscribe({
      next: (res) => this.servicios = res.data.sort((a, b) => Number(b.precio) - Number(a.precio)),
      error: () => console.error('Error al cargar servicios')
    });
  }

  get serviciosFiltradosPorCategoria(): IServicio[] {
    return this.servicios.filter(s => s.categoria === this.categoriaActivaServicio);
  }

  get serviciosEnGrupos(): IServicio[][] {
    const grupos: IServicio[][] = [];
    const filtrados = this.serviciosFiltradosPorCategoria;
    for (let i = 0; i < filtrados.length; i += 6) {
      grupos.push(filtrados.slice(i, i + 6));
    }
    return grupos;
  }

  get grupoActualServicios(): IServicio[] {
    return this.serviciosEnGrupos[this.grupoActual] || [];
  }

  get serviciosPorCategoria(): IServicio[] {
    return this.serviciosFiltradosPorCategoria;
  }

  get totalGrupos(): number {
    return this.serviciosEnGrupos.length;
  }

  siguienteGrupo(): void {
    if (this.grupoActual < this.totalGrupos - 1) this.grupoActual++;
  }

  anteriorGrupo(): void {
    if (this.grupoActual > 0) this.grupoActual--;
  }

  irAGrupo(index: number): void {
    this.grupoActual = index;
  }

  cambiarCategoriaServicio(id: string): void {
    this.categoriaActivaServicio = id;
    this.grupoActual = 0;
  }

  agendarConServicio(servicio: IServicio): void {
    sessionStorage.setItem('servicio_preseleccionado', JSON.stringify(servicio));
    this.router.navigate(['/agendar']);
  }

  // ─── Barberos ─────────────────────────────────────────────
  barberos: IBarbero[] = [];
  barberoSeleccionado: IBarbero | null = null;

  cargarBarberos(): void {
    this.barberoService.getAll().subscribe({
      next: (res) => this.barberos = res.data,
      error: () => console.error('Error al cargar barberos')
    });
  }

  getEstrellas(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  abrirModalBarbero(barbero: IBarbero): void {
    this.barberoSeleccionado = barbero;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalBarbero(): void {
    this.barberoSeleccionado = null;
    document.body.style.overflow = 'auto';
  }

  agendarConBarbero(barbero: IBarbero): void {
    sessionStorage.setItem('barbero_preseleccionado', JSON.stringify(barbero));
    this.cerrarModalBarbero();
    this.router.navigate(['/agendar']);
  }

  // ─── Productos ────────────────────────────────────────────
  categoriaActiva = 'barberia';

  categorias = [
    { id: 'barberia', nombre: 'Barbería', icon: 'fas fa-cut' },
    { id: 'ropa', nombre: 'Ropa', icon: 'fas fa-tshirt' },
    { id: 'accesorios', nombre: 'Accesorios', icon: 'fas fa-watch' },
    { id: 'cuidado', nombre: 'Cuidado', icon: 'fas fa-spa' }
  ];

  productos: { [key: string]: any[] } = {
    barberia: [
      { imagen: 'assets/images/productos/pomada.jpg', nombre: 'Pomada Fijadora', descripcion: 'Fijación fuerte, acabado brillante.', precio: '$35.000', tallas: [] },
      { imagen: 'assets/images/productos/aceite.jpg', nombre: 'Aceite de Barba', descripcion: 'Hidratación y suavizado de barba.', precio: '$28.000', tallas: [] },
      { imagen: 'assets/images/productos/shampoo.jpg', nombre: 'Shampoo Profesional', descripcion: 'Shampoo para cabello y barba.', precio: '$22.000', tallas: [] },
      { imagen: 'assets/images/productos/cera.jpg', nombre: 'Cera Mate', descripcion: 'Fijación media, acabado mate.', precio: '$32.000', tallas: [] }
    ],
    ropa: [
      { imagen: 'assets/images/productos/camisa1.jpg', nombre: 'Camisa Estilo', descripcion: 'Camisa casual de alta calidad.', precio: '$85.000', tallas: ['S','M','L','XL'] },
      { imagen: 'assets/images/productos/camisa3.jpg', nombre: 'Camisa Oxford', descripcion: 'Camisa casual de algodón premium, corte slim.', precio: '$85.000', tallas: ['S','M','L','XL'] },
      { imagen: 'assets/images/productos/camisa4.jpg', nombre: 'Camisa Lino', descripcion: 'Camisa de lino fresca y elegante.', precio: '$92.000', tallas: ['S','M','L','XL'] },
      { imagen: 'assets/images/productos/jean1.jpg', nombre: 'Jean Slim Fit', descripcion: 'Jean oscuro de corte slim, cómodo y moderno.', precio: '$120.000', tallas: ['28','30','32','34','36'] },
      { imagen: 'assets/images/productos/jean2.jpg', nombre: 'Jean Straight', descripcion: 'Jean clásico de corte recto, versátil.', precio: '$110.000', tallas: ['28','30','32','34','36'] },
      { imagen: 'assets/images/productos/jean3.jpg', nombre: 'Jean Slim', descripcion: 'Jean moderno de corte slim fit premium.', precio: '$120.000', tallas: ['28','30','32','34','36'] },
      { imagen: 'assets/images/productos/pantaloneta.jpg', nombre: 'Pantaloneta', descripcion: 'Perfecta para el día a día.', precio: '$65.000', tallas: ['S','M','L','XL'] },
      { imagen: 'assets/images/productos/pantaloneta1.jpg', nombre: 'Pantaloneta Urbana', descripcion: 'Pantaloneta deportiva con estilo urbano.', precio: '$65.000', tallas: ['S','M','L','XL'] }
    ],
    accesorios: [
      { imagen: 'assets/images/productos/reloj1.jpg', nombre: 'Reloj Clásico Negro', descripcion: 'Reloj elegante de acero inoxidable, correa negra.', precio: '$180.000', tallas: [] },
      { imagen: 'assets/images/productos/reloj2.jpg', nombre: 'Reloj Clásico', descripcion: 'Elegancia en tu muñeca.', precio: '$180.000', tallas: [] },
      { imagen: 'assets/images/productos/reloj3.jpg', nombre: 'Reloj Dorado', descripcion: 'Reloj minimalista con acabado dorado premium.', precio: '$220.000', tallas: [] },
      { imagen: 'assets/images/productos/correa1.jpg', nombre: 'Correa Cuero Café', descripcion: 'Correa genuina de cuero café, hebilla plateada.', precio: '$55.000', tallas: ['S','M','L'] },
      { imagen: 'assets/images/productos/correa2.jpg', nombre: 'Correa de Cuero', descripcion: 'Correa genuina de alta calidad.', precio: '$55.000', tallas: ['S','M','L'] },
      { imagen: 'assets/images/productos/correa3.jpg', nombre: 'Correa Cuero Negro', descripcion: 'Correa de cuero negro clásico, resistente.', precio: '$55.000', tallas: ['S','M','L'] },
      { imagen: 'assets/images/productos/bolso.jpg', nombre: 'Bolso Urbano', descripcion: 'Bolso de cuero sintético con compartimentos.', precio: '$95.000', tallas: [] },
      { imagen: 'assets/images/productos/bolso1.jpg', nombre: 'Bolso Premium', descripcion: 'Estilo y funcionalidad en un solo bolso.', precio: '$95.000', tallas: [] },
      { imagen: 'assets/images/productos/gorra1.jpg', nombre: 'Gorra Snapback', descripcion: 'Gorra urbana con cierre ajustable y visera plana.', precio: '$45.000', tallas: ['Única'] },
      { imagen: 'assets/images/productos/gorra2.jpg', nombre: 'Gorra Dad Hat', descripcion: 'Gorra estilo dad hat, cómoda y versátil.', precio: '$40.000', tallas: ['Única'] },
      { imagen: 'assets/images/productos/gorra3.jpg', nombre: 'Gorra Premium', descripcion: 'Estilo urbano y moderno.', precio: '$45.000', tallas: ['Única'] },
      { imagen: 'assets/images/productos/zapato.jpg', nombre: 'Zapatos Casual', descripcion: 'Comodidad y estilo único.', precio: '$220.000', tallas: ['38','39','40','41','42','43'] },
      { imagen: 'assets/images/productos/zapato1.jpg', nombre: 'Zapatos Derby', descripcion: 'Zapatos de cuero clásicos para looks formales.', precio: '$220.000', tallas: ['38','39','40','41','42','43'] },
      { imagen: 'assets/images/productos/zapato2.jpg', nombre: 'Sneakers Urbanos', descripcion: 'Zapatillas urbanas con suela gruesa y diseño moderno.', precio: '$185.000', tallas: ['38','39','40','41','42','43'] },
      { imagen: 'assets/images/productos/zapato3.jpg', nombre: 'Mocasines Casual', descripcion: 'Mocasines cómodos de cuero suave.', precio: '$160.000', tallas: ['38','39','40','41','42','43'] }
    ],
    cuidado: [
      { imagen: 'assets/images/productos/locion.jpg', nombre: 'Loción Aftershave', descripcion: 'Post afeitado refrescante con fragancia cítrica.', precio: '$25.000', tallas: [] },
      { imagen: 'assets/images/productos/locion1.jpg', nombre: 'Loción Hidratante', descripcion: 'Hidratación facial profunda de uso diario.', precio: '$30.000', tallas: [] },
      { imagen: 'assets/images/productos/cremamanos.jpg', nombre: 'Crema de Manos', descripcion: 'Crema nutritiva con vitamina E para manos suaves.', precio: '$18.000', tallas: [] },
      { imagen: 'assets/images/productos/balsamo.jpg', nombre: 'Bálsamo de Barba', descripcion: 'Suaviza y nutre la barba con aceites naturales.', precio: '$30.000', tallas: [] },
      { imagen: 'assets/images/productos/serum.jpg', nombre: 'Sérum Capilar', descripcion: 'Fortalece y brilla el cabello.', precio: '$38.000', tallas: [] }
    ]
  };

  get productosFiltrados() {
    return this.productos[this.categoriaActiva] || [];
  }

  cambiarCategoria(id: string): void {
    this.categoriaActiva = id;
  }

  productoSeleccionado: any = null;

  cerrarModal(): void {
    this.productoSeleccionado = null;
    document.body.style.overflow = 'auto';
  }

  tallaSeleccionada: string = '';

  seleccionarTalla(talla: string): void {
    this.tallaSeleccionada = talla;
  }

  abrirModal(producto: any): void {
    this.productoSeleccionado = producto;
    this.tallaSeleccionada = '';
    document.body.style.overflow = 'hidden';
  }

  // ─── Razones ──────────────────────────────────────────────
  razones = [
    { icon: 'fas fa-medal', titulo: 'Barberos Expertos', descripcion: 'Profesionales con años de experiencia y formación continua.' },
    { icon: 'fas fa-leaf', titulo: 'Productos Premium', descripcion: 'Usamos las mejores marcas para cuidar tu cabello y barba.' },
    { icon: 'fas fa-calendar-check', titulo: 'Reserva Fácil', descripcion: 'Agenda tu cita en minutos desde nuestra plataforma.' },
    { icon: 'fas fa-smile', titulo: 'Ambiente Único', descripcion: 'Un espacio diseñado para tu comodidad y relax.' }
  ];

  // ─── Galería ──────────────────────────────────────────────
  galeriaColumnas = [
    [
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria.jpg', alt: 'Corte clásico' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria13.jpg', alt: 'Corte moderno' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria6.jpg', alt: 'Corte infantil' },
    ],
    [
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria5.jpg', alt: 'Estilo urbano' },
      { tipo: 'video', src: 'assets/images/galeria/GaleVideo1.mp4', alt: 'Corte extra' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria12.jpg', alt: 'Corte con estilo' },
    ],
    [
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria2.jpg', alt: 'Arreglo de barba' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria11.jpg', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria7.jpg', alt: 'Corte con estilo' },
    ],
    [
      { tipo: 'video', src: 'assets/images/galeria/GaleVideo4.mp4', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria9.jpg', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria3.jpg', alt: 'Corte moderno' },
    ],
    [
      { tipo: 'video', src: 'assets/images/galeria/GaleVideo3.mp4', alt: 'Corte extra' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria4.jpg', alt: 'Afeitado clásico' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria8.jpg', alt: 'Corte moderno' },
    ],
    [
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria10.jpg', alt: 'Corte con estilo' },
      { tipo: 'video', src: 'assets/images/galeria/GaleVideo5.mp4', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria1.jpg', alt: 'Corte con estilo' },
    ],
  ];

  galeriaVisible = 6;

  get galeriaColumnasMostradas() {
    return this.galeriaColumnas.slice(0, this.galeriaVisible);
  }

  verMasGaleria(): void {
    this.galeriaVisible = this.galeriaColumnas.length;
  }

  verMenosGaleria(): void {
    this.galeriaVisible = this.esMobil() ? 3 : 6;
  }

  get hayMasGaleria(): boolean {
    return this.galeriaVisible < this.galeriaColumnas.length;
  }

  scrollGaleria(direction: 'left' | 'right'): void {
    const track = this.galeriaTrack.nativeElement;
    const scrollAmount = 400;
    track.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  }

  playVideo(event: MouseEvent): void {
    const wrapper = event.currentTarget as HTMLElement;
    const video = wrapper.querySelector('video') as HTMLVideoElement;
    if (video) video.play();
  }

  pauseVideo(event: MouseEvent): void {
    const wrapper = event.currentTarget as HTMLElement;
    const video = wrapper.querySelector('video') as HTMLVideoElement;
    if (video) video.pause();
  }
  get galeriaItemsMostrados() {
  if (this.esMobil()) {
    const todosItems: any[] = [];
    this.galeriaColumnas.forEach(col => col.forEach(item => todosItems.push(item)));
    return todosItems.slice(0, this.galeriaVisible);
  }
  return [];
}
}