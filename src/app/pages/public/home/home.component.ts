import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ServicioService, IServicio } from '../../../core/services/servicio.service';
import { BarberoService, IBarbero } from '../../../core/services/barbero.service';
import { Router } from '@angular/router';
import { ResenaService } from '../../../core/services/resena.service';

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
    private router: Router,
    private resenaService: ResenaService
  ) { }

  ngOnInit(): void {
    this.categoriaActivaServicio = 'clasicos';
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

  // ─── Resenas ──────────────────────────────────────────────
  modalResenas = false;
  barberoResenas: IBarbero | null = null;
  resenas: any[] = [];
  cargandoResenas = false;

  abrirModalResenas(barbero: IBarbero, event: Event): void {
    event.stopPropagation();
    this.barberoResenas = barbero;
    this.modalResenas = true;
    this.cargandoResenas = true;
    this.resenas = [];
    document.body.style.overflow = 'hidden';
    this.resenaService.getByBarbero(barbero.id_usuario).subscribe({
      next: (res) => { this.resenas = res.data; this.cargandoResenas = false; },
      error: () => this.cargandoResenas = false
    });
  }

  cerrarModalResenas(): void {
    this.modalResenas = false;
    this.barberoResenas = null;
    this.resenas = [];
    document.body.style.overflow = 'auto';
  }

  getEstrellasArray(n: number): number[] {
    return Array(Math.round(n)).fill(0);
  }

  // ─── Servicios ────────────────────────────────────────────
  servicios: IServicio[] = [];
  grupoActual = 0;
  categoriaActivaServicio = 'clasicos';

  categoriasServicio = [
    { id: 'clasicos', nombre: 'Clasicos' },
    { id: 'combos', nombre: 'Combos' },
    { id: 'premium', nombre: 'Premium' }
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
    return [this.serviciosFiltradosPorCategoria.slice(0, 4)];
  }

  get grupoActualServicios(): IServicio[] {
    return this.serviciosFiltradosPorCategoria.slice(0, 4);
  }

  get serviciosPorCategoria(): IServicio[] {
    return this.serviciosFiltradosPorCategoria.slice(0, 4);
  }

  get totalGrupos(): number {
    return this.serviciosEnGrupos.length;
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
  productosVisibles = 4;

  categorias = [
    { id: 'barberia', nombre: 'Barbería', icon: 'fas fa-cut' },
    { id: 'ropa', nombre: 'Ropa', icon: 'fas fa-tshirt' },
    { id: 'accesorios', nombre: 'Accesorios', icon: 'fas fa-gem' },
    { id: 'cuidado', nombre: 'Cuidado', icon: 'fas fa-leaf' }
  ];

  productos: { [key: string]: any[] } = {
    barberia: [
      { imagen: 'assets/images/productos/pomada.jpg', nombre: 'Pomada Fijadora', descripcion: 'Fijacion fuerte, acabado brillante.', precio: '$35.000', tallas: [] },
      { imagen: 'assets/images/productos/aceite.jpg', nombre: 'Aceite de Barba', descripcion: 'Hidratacion y suavizado de barba.', precio: '$28.000', tallas: [] },
      { imagen: 'assets/images/productos/shampoo.jpg', nombre: 'Shampoo Profesional', descripcion: 'Shampoo para cabello y barba.', precio: '$22.000', tallas: [] },
      { imagen: 'assets/images/productos/cera.jpg', nombre: 'Cera Mate', descripcion: 'Fijacion media, acabado mate.', precio: '$32.000', tallas: [] }
    ],
    ropa: [
      { imagen: 'assets/images/productos/camisa1.jpg', nombre: 'Camisa Estilo', descripcion: 'Camisa casual de alta calidad.', precio: '$85.000', tallas: ['S', 'M', 'L', 'XL'] },
      { imagen: 'assets/images/productos/camisa3.jpg', nombre: 'Camisa Oxford', descripcion: 'Camisa casual de algodon premium, corte slim.', precio: '$85.000', tallas: ['S', 'M', 'L', 'XL'] },
      { imagen: 'assets/images/productos/camisa4.jpg', nombre: 'Camisa Lino', descripcion: 'Camisa de lino fresca y elegante.', precio: '$92.000', tallas: ['S', 'M', 'L', 'XL'] },
      { imagen: 'assets/images/productos/jean1.jpg', nombre: 'Jean Slim Fit', descripcion: 'Jean oscuro de corte slim, comodo y moderno.', precio: '$120.000', tallas: ['28', '30', '32', '34', '36'] },
      { imagen: 'assets/images/productos/jean2.jpg', nombre: 'Jean Straight', descripcion: 'Jean clasico de corte recto, versatil.', precio: '$110.000', tallas: ['28', '30', '32', '34', '36'] },
      { imagen: 'assets/images/productos/jean3.jpg', nombre: 'Jean Slim', descripcion: 'Jean moderno de corte slim fit premium.', precio: '$120.000', tallas: ['28', '30', '32', '34', '36'] },
      { imagen: 'assets/images/productos/pantaloneta.jpg', nombre: 'Pantaloneta', descripcion: 'Perfecta para el dia a dia.', precio: '$65.000', tallas: ['S', 'M', 'L', 'XL'] },
      { imagen: 'assets/images/productos/pantaloneta1.jpg', nombre: 'Pantaloneta Urbana', descripcion: 'Pantaloneta deportiva con estilo urbano.', precio: '$65.000', tallas: ['S', 'M', 'L', 'XL'] }
    ],
    accesorios: [
      { imagen: 'assets/images/productos/reloj1.jpg', nombre: 'Reloj Clasico Negro', descripcion: 'Reloj elegante de acero inoxidable, correa negra.', precio: '$180.000', tallas: [] },
      { imagen: 'assets/images/productos/reloj2.jpg', nombre: 'Reloj Clasico', descripcion: 'Elegancia en tu muneca.', precio: '$180.000', tallas: [] },
      { imagen: 'assets/images/productos/reloj3.jpg', nombre: 'Reloj Dorado', descripcion: 'Reloj minimalista con acabado dorado premium.', precio: '$220.000', tallas: [] },
      { imagen: 'assets/images/productos/correa1.jpg', nombre: 'Correa Cuero Cafe', descripcion: 'Correa genuina de cuero cafe, hebilla plateada.', precio: '$55.000', tallas: ['S', 'M', 'L'] },
      { imagen: 'assets/images/productos/correa2.jpg', nombre: 'Correa de Cuero', descripcion: 'Correa genuina de alta calidad.', precio: '$55.000', tallas: ['S', 'M', 'L'] },
      { imagen: 'assets/images/productos/correa3.jpg', nombre: 'Correa Cuero Negro', descripcion: 'Correa de cuero negro clasico, resistente.', precio: '$55.000', tallas: ['S', 'M', 'L'] },
      { imagen: 'assets/images/productos/bolso.jpg', nombre: 'Bolso Urbano', descripcion: 'Bolso de cuero sintetico con compartimentos.', precio: '$95.000', tallas: [] },
      { imagen: 'assets/images/productos/bolso1.jpg', nombre: 'Bolso Premium', descripcion: 'Estilo y funcionalidad en un solo bolso.', precio: '$95.000', tallas: [] },
      { imagen: 'assets/images/productos/gorra1.jpg', nombre: 'Gorra Snapback', descripcion: 'Gorra urbana con cierre ajustable y visera plana.', precio: '$45.000', tallas: ['Unica'] },
      { imagen: 'assets/images/productos/gorra2.jpg', nombre: 'Gorra Dad Hat', descripcion: 'Gorra estilo dad hat, comoda y versatil.', precio: '$40.000', tallas: ['Unica'] },
      { imagen: 'assets/images/productos/gorra3.jpg', nombre: 'Gorra Premium', descripcion: 'Estilo urbano y moderno.', precio: '$45.000', tallas: ['Unica'] },
      { imagen: 'assets/images/productos/zapato.jpg', nombre: 'Zapatos Casual', descripcion: 'Comodidad y estilo unico.', precio: '$220.000', tallas: ['38', '39', '40', '41', '42', '43'] },
      { imagen: 'assets/images/productos/zapato1.jpg', nombre: 'Zapatos Derby', descripcion: 'Zapatos de cuero clasicos para looks formales.', precio: '$220.000', tallas: ['38', '39', '40', '41', '42', '43'] },
      { imagen: 'assets/images/productos/zapato2.jpg', nombre: 'Sneakers Urbanos', descripcion: 'Zapatillas urbanas con suela gruesa y diseno moderno.', precio: '$185.000', tallas: ['38', '39', '40', '41', '42', '43'] },
      { imagen: 'assets/images/productos/zapato3.jpg', nombre: 'Mocasines Casual', descripcion: 'Mocasines comodos de cuero suave.', precio: '$160.000', tallas: ['38', '39', '40', '41', '42', '43'] }
    ],
    cuidado: [
      { imagen: 'assets/images/productos/locion.jpg', nombre: 'Locion Aftershave', descripcion: 'Post afeitado refrescante con fragancia citrica.', precio: '$25.000', tallas: [] },
      { imagen: 'assets/images/productos/locion1.jpg', nombre: 'Locion Hidratante', descripcion: 'Hidratacion facial profunda de uso diario.', precio: '$30.000', tallas: [] },
      { imagen: 'assets/images/productos/cremamanos.jpg', nombre: 'Crema de Manos', descripcion: 'Crema nutritiva con vitamina E para manos suaves.', precio: '$18.000', tallas: [] },
      { imagen: 'assets/images/productos/balsamo.jpg', nombre: 'Balsamo de Barba', descripcion: 'Suaviza y nutre la barba con aceites naturales.', precio: '$30.000', tallas: [] },
      { imagen: 'assets/images/productos/serum.jpg', nombre: 'Serum Capilar', descripcion: 'Fortalece y brilla el cabello.', precio: '$38.000', tallas: [] }
    ]
  };

  get productosFiltrados() {
    return this.productos[this.categoriaActiva] || [];
  }

  get productosMostrados() {
    return this.productosFiltrados.slice(0, this.productosVisibles);
  }

  get hayMasProductos(): boolean {
    return this.productosVisibles < this.productosFiltrados.length;
  }

  get estaExpandidoProductos(): boolean {
    return this.productosVisibles > 4;
  }

  verMasProductos(): void {
    this.productosVisibles += 4;
  }

  verMenosProductos(): void {
    this.productosVisibles = 4;
  }

  cambiarCategoria(id: string): void {
    this.categoriaActiva = id;
    this.productosVisibles = 4;
  }

  productoSeleccionado: any = null;
  tallaSeleccionada: string = '';

  cerrarModal(): void {
    this.productoSeleccionado = null;
    document.body.style.overflow = 'auto';
  }

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
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria.jpg', alt: 'Corte clasico' },
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
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria4.jpg', alt: 'Afeitado clasico' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria8.jpg', alt: 'Corte moderno' },
    ],
    [
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria10.jpg', alt: 'Corte con estilo' },
      { tipo: 'video', src: 'assets/images/galeria/GaleVideo5.mp4', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria1.jpg', alt: 'Corte con estilo' },
    ],
  ];

  galeriaVisible = 6;

  get hayMasGaleria(): boolean {
    if (this.esMobil()) {
      const totalItems = this.galeriaColumnas.reduce((acc, col) => acc + col.length, 0);
      return this.galeriaVisible < totalItems;
    }
    return this.galeriaVisible < this.galeriaColumnas.length;
  }

  verMasGaleria(): void {
    this.galeriaVisible += 6;
  }

  verMenosGaleria(): void {
    this.galeriaVisible = this.esMobil() ? 6 : 6;
  }

  get galeriaColumnasMostradas() {
    return this.galeriaColumnas.slice(0, this.galeriaVisible);
  }

  get galeriaItemsMostrados() {
    if (this.esMobil()) {
      const todosItems: any[] = [];
      this.galeriaColumnas.forEach(col => col.forEach(item => todosItems.push(item)));
      return todosItems.slice(0, this.galeriaVisible);
    }
    return [];
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
  irAGrupo(index: number): void {
    this.grupoActual = index;
  }
}