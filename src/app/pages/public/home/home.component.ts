import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ServicioService, IServicio } from '../../../core/services/servicio.service';
import { BarberoService, IBarbero } from '../../../core/services/barbero.service';
import { ProductoService, IProducto } from '../../../core/services/producto.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ResenaService } from '../../../core/services/resena.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  @ViewChild('galeriaTrack') galeriaTrack!: ElementRef;

  imagenUrl = `${environment.apiUrl.replace('/api', '')}/images/productos/`;

  constructor(
    private servicioService: ServicioService,
    private barberoService:  BarberoService,
    private productoService: ProductoService,
    private carritoService:  CarritoService,
    private authService:     AuthService,
    private router:          Router,
    private resenaService:   ResenaService
  ) {}

  ngOnInit(): void {
    this.categoriaActivaServicio = 'clasicos';
    this.galeriaVisible = 6;
    this.cargarServicios();
    this.cargarBarberos();
    this.cargarProductos();
  }

  scrollTo(seccion: string): void {
    const elemento = document.getElementById(seccion);
    if (elemento) {
      const top = elemento.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  esMobil(): boolean { return window.innerWidth <= 768; }

  // ─── Reseñas ──────────────────────────────────────────────
  modalResenas    = false;
  barberoResenas: IBarbero | null = null;
  resenas:        any[] = [];
  cargandoResenas = false;

  abrirModalResenas(barbero: IBarbero, event: Event): void {
    event.stopPropagation();
    this.barberoResenas  = barbero;
    this.modalResenas    = true;
    this.cargandoResenas = true;
    this.resenas         = [];
    document.body.style.overflow = 'hidden';
    this.resenaService.getByBarbero(barbero.id_usuario).subscribe({
      next: (res) => { this.resenas = res.data; this.cargandoResenas = false; },
      error: () => this.cargandoResenas = false
    });
  }

  cerrarModalResenas(): void {
    this.modalResenas   = false;
    this.barberoResenas = null;
    this.resenas        = [];
    document.body.style.overflow = 'auto';
  }

  getEstrellasArray(n: number): number[] { return Array(Math.round(n)).fill(0); }

  // ─── Servicios ────────────────────────────────────────────
  servicios: IServicio[] = [];
  grupoActual = 0;
  categoriaActivaServicio = 'clasicos';

  categoriasServicio = [
    { id: 'clasicos', nombre: 'Clasicos' },
    { id: 'combos',   nombre: 'Combos'   },
    { id: 'premium',  nombre: 'Premium'  }
  ];

  cargarServicios(): void {
    this.servicioService.getAll().subscribe({
      next: (res) => this.servicios = res.data.sort((a, b) => Number(b.precio) - Number(a.precio)),
      error: () => {}
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

  get totalGrupos(): number { return this.serviciosEnGrupos.length; }

  cambiarCategoriaServicio(id: string): void {
    this.categoriaActivaServicio = id;
    this.grupoActual = 0;
  }

  agendarConServicio(servicio: IServicio): void {
    sessionStorage.setItem('servicio_preseleccionado', JSON.stringify(servicio));
    this.router.navigate(['/agendar']);
  }

  irAGrupo(index: number): void { this.grupoActual = index; }

  // ─── Barberos ─────────────────────────────────────────────
  barberos: IBarbero[] = [];
  barberoSeleccionado: IBarbero | null = null;

  cargarBarberos(): void {
    this.barberoService.getAll().subscribe({
      next: (res) => this.barberos = res.data,
      error: () => {}
    });
  }

  getEstrellas(rating: number): number[] { return Array(Math.floor(rating)).fill(0); }

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

  // ─── Productos desde BD ───────────────────────────────────
  productosDB:      IProducto[] = [];
  cargandoProductos = false;
  categoriaActiva   = 'barberia';
  productosVisibles = 4;

  productoSeleccionado: IProducto | null = null;
  tallaSeleccionada    = '';
  agregadoExito        = false;

  categorias = [
    { id: 'barberia',   nombre: 'Barbería',   icon: 'fas fa-cut'    },
    { id: 'ropa',       nombre: 'Ropa',       icon: 'fas fa-tshirt' },
    { id: 'accesorios', nombre: 'Accesorios', icon: 'fas fa-gem'    },
    { id: 'cuidado',    nombre: 'Cuidado',    icon: 'fas fa-leaf'   }
  ];

  cargarProductos(): void {
    this.cargandoProductos = true;
    this.productoService.getAll().subscribe({
      next: (res) => {
        this.productosDB      = res.data.filter(p => p.estado === 'activo');
        this.cargandoProductos = false;
      },
      error: () => this.cargandoProductos = false
    });
  }

  get productosFiltrados(): IProducto[] {
    return this.productosDB.filter(p => p.categoria === this.categoriaActiva);
  }

  get productosMostrados(): IProducto[] {
    return this.productosFiltrados.slice(0, this.productosVisibles);
  }

  get hayMasProductos(): boolean {
    return this.productosVisibles < this.productosFiltrados.length;
  }

  get estaExpandidoProductos(): boolean {
    return this.productosVisibles > 4;
  }

  cambiarCategoria(id: string): void {
    this.categoriaActiva   = id;
    this.productosVisibles = 4;
  }

  verMasProductos(): void   { this.productosVisibles += 4; }
  verMenosProductos(): void { this.productosVisibles = 4; }

  getImagenProducto(p: IProducto): string {
    if (p.imagen) return `${this.imagenUrl}${p.imagen}`;
    return 'assets/images/no-img.png';
  }

  abrirModal(producto: IProducto): void {
    this.productoSeleccionado = producto;
    this.tallaSeleccionada    = '';
    this.agregadoExito        = false;
    document.body.style.overflow = 'hidden';
  }

  cerrarModal(): void {
    this.productoSeleccionado = null;
    document.body.style.overflow = 'auto';
  }

  seleccionarTalla(talla: string): void { this.tallaSeleccionada = talla; }

  // ─── Carrito ──────────────────────────────────────────────
  agregarAlCarrito(producto: IProducto, event?: Event): void {
    if (event) event.stopPropagation();
    if (producto.stock === 0) return;

    const usuario = this.authService.getUsuario();

    if (!usuario) {
      sessionStorage.setItem('producto_pendiente_carrito', JSON.stringify(producto));
      this.router.navigate(['/login']);
      return;
    }

    if (usuario.rol === 'admin' || usuario.rol === 'barbero') return;

    this.carritoService.agregar(producto);
    this.agregadoExito = true;
    setTimeout(() => this.agregadoExito = false, 2000);
  }

  // ─── Razones ──────────────────────────────────────────────
  razones = [
    { icon: 'fas fa-medal',          titulo: 'Barberos Expertos', descripcion: 'Profesionales con años de experiencia y formación continua.' },
    { icon: 'fas fa-leaf',           titulo: 'Productos Premium', descripcion: 'Usamos las mejores marcas para cuidar tu cabello y barba.'    },
    { icon: 'fas fa-calendar-check', titulo: 'Reserva Fácil',     descripcion: 'Agenda tu cita en minutos desde nuestra plataforma.'         },
    { icon: 'fas fa-smile',          titulo: 'Ambiente Único',    descripcion: 'Un espacio diseñado para tu comodidad y relax.'               }
  ];

  // ─── Galería ──────────────────────────────────────────────
  galeriaColumnas = [
    [
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria.jpg',   alt: 'Corte clasico'   },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria13.jpg', alt: 'Corte moderno'   },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria6.jpg',  alt: 'Corte infantil'  },
    ],
    [
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria5.jpg',   alt: 'Estilo urbano'    },
      { tipo: 'video',  src: 'assets/images/galeria/GaleVideo1.mp4', alt: 'Corte extra'      },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria12.jpg',  alt: 'Corte con estilo' },
    ],
    [
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria2.jpg',  alt: 'Arreglo de barba' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria11.jpg', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria7.jpg',  alt: 'Corte con estilo' },
    ],
    [
      { tipo: 'video',  src: 'assets/images/galeria/GaleVideo4.mp4', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria9.jpg',   alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria3.jpg',   alt: 'Corte moderno'    },
    ],
    [
      { tipo: 'video',  src: 'assets/images/galeria/GaleVideo3.mp4', alt: 'Corte extra'    },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria4.jpg',   alt: 'Afeitado clasico' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria8.jpg',   alt: 'Corte moderno'    },
    ],
    [
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria10.jpg',  alt: 'Corte con estilo' },
      { tipo: 'video',  src: 'assets/images/galeria/GaleVideo5.mp4', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'assets/images/galeria/Galeria1.jpg',   alt: 'Corte con estilo' },
    ],
  ];

  galeriaVisible = 6;

  get hayMasGaleria(): boolean {
    if (this.esMobil()) {
      const total = this.galeriaColumnas.reduce((acc, col) => acc + col.length, 0);
      return this.galeriaVisible < total;
    }
    return this.galeriaVisible < this.galeriaColumnas.length;
  }

  verMasGaleria(): void   { this.galeriaVisible += 6; }
  verMenosGaleria(): void { this.galeriaVisible = 6;  }

  get galeriaColumnasMostradas() {
    return this.galeriaColumnas.slice(0, this.galeriaVisible);
  }

  get galeriaItemsMostrados() {
    if (this.esMobil()) {
      const todos: any[] = [];
      this.galeriaColumnas.forEach(col => col.forEach(item => todos.push(item)));
      return todos.slice(0, this.galeriaVisible);
    }
    return [];
  }

  scrollGaleria(direction: 'left' | 'right'): void {
    const track = this.galeriaTrack.nativeElement;
    track.scrollBy({ left: direction === 'right' ? 400 : -400, behavior: 'smooth' });
  }

  playVideo(event: MouseEvent): void {
    const video = (event.currentTarget as HTMLElement).querySelector('video') as HTMLVideoElement;
    if (video) video.play();
  }

  pauseVideo(event: MouseEvent): void {
    const video = (event.currentTarget as HTMLElement).querySelector('video') as HTMLVideoElement;
    if (video) video.pause();
  }
}