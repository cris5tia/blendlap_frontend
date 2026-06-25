import { Component, ElementRef, ViewChild, OnInit, HostListener } from '@angular/core';
import { ServicioService, IServicio } from '../../../core/services/servicio.service';
import { BarberoService, IBarbero } from '../../../core/services/barbero.service';
import { ProductoService, IProducto } from '../../../core/services/producto.service';
import { CarritoService, IItemCarrito } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
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

  constructor(
    private servicioService: ServicioService,
    private barberoService: BarberoService,
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router,
    private resenaService: ResenaService
  ) { }

  get esRolRestringido(): boolean {
    const rol = this.authService.getRol();
    return rol === 'admin' || rol === 'barbero';
  }

  ngOnInit(): void {
    this.categoriaActivaServicio = 'clasicos';
    this.galeriaVisible = 6;
    this.cargarServicios();
    this.cargarBarberos();
    this.cargarProductos();
    this.verificarProductoPendiente();
    this.carritoService.items$.subscribe(items => this.itemsCarrito = items);
  }

  mostrarScrollTop = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.mostrarScrollTop = window.scrollY > 400;
  }

  scrollAlTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  getEstrellasArray(n: number): number[] { return Array(Math.round(n)).fill(0); }

  // ─── Servicios ────────────────────────────────────────────
  servicios: IServicio[] = [];
  cargandoServicios = false;
  errorServicios = false;
  grupoActual = 0;
  categoriaActivaServicio = 'clasicos';

  categoriasServicio = [
    { id: 'clasicos', nombre: 'Clásicos', icon: 'fas fa-cut' },
    { id: 'premium', nombre: 'Premium', icon: 'fas fa-crown' }
  ];

  cargarServicios(): void {
    this.cargandoServicios = true;
    this.errorServicios = false;
    this.servicioService.getAll({ activos: true }).subscribe({
      next: (res) => {
        this.servicios = res.data.sort((a, b) => Number(a.precio) - Number(b.precio));
        this.cargandoServicios = false;
      },
      error: () => {
        this.errorServicios = true;
        this.cargandoServicios = false;
      }
    });
  }

  get serviciosFiltradosPorCategoria(): IServicio[] {
    return this.servicios.filter(s => s.categoria === this.categoriaActivaServicio);
  }

  get serviciosEnGrupos(): IServicio[][] {
    const items = this.serviciosFiltradosPorCategoria;
    const grupos: IServicio[][] = [];
    for (let i = 0; i < items.length; i += 4) {
      grupos.push(items.slice(i, i + 4));
    }
    return grupos.length > 0 ? grupos : [[]];
  }

  get grupoActualServicios(): IServicio[] {
    return this.serviciosEnGrupos[this.grupoActual] ?? [];
  }

  get serviciosPorCategoria(): IServicio[] {
    return this.serviciosFiltradosPorCategoria;
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
  cargandoBarberos = false;
  errorBarberos = false;
  barberoSeleccionado: IBarbero | null = null;
  paginaBarbero = 0;
  readonly BARBEROS_POR_PAGINA = 3;

  cargarBarberos(): void {
    this.cargandoBarberos = true;
    this.errorBarberos = false;
    this.barberoService.getAll().subscribe({
      next: (res) => {
        this.barberos = res.data;
        this.paginaBarbero = 0;
        this.cargandoBarberos = false;
      },
      error: () => {
        this.errorBarberos = true;
        this.cargandoBarberos = false;
      }
    });
  }

  get barberosPagina(): IBarbero[] {
    const inicio = this.paginaBarbero * this.BARBEROS_POR_PAGINA;
    return this.barberos.slice(inicio, inicio + this.BARBEROS_POR_PAGINA);
  }

  get barberosMostrados(): IBarbero[] {
    return this.esMobil() ? this.barberos : this.barberosPagina;
  }

  get totalPaginasBarbero(): number[] {
    return Array(Math.ceil(this.barberos.length / this.BARBEROS_POR_PAGINA)).fill(0);
  }

  irPaginaBarbero(i: number): void { this.paginaBarbero = i; }

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

  // ─── Productos ────────────────────────────────────────────
  productosDB: IProducto[] = [];
  cargandoProductos = false;
  errorProductos = false;
  categoriaActiva = 'cuidado';
  productosVisibles = 4;

  productoSeleccionado: IProducto | null = null;
  tallaSeleccionada = '';
  tallaElegida = '';

  // Modal carrito confirmación
  modalCarritoVisible = false;
  itemsCarrito: IItemCarrito[] = [];

  categorias = [
  { id: 'cuidado',    nombre: 'Cuidado',     icon: 'fas fa-leaf' },
  { id: 'barberia',   nombre: 'Barbería',    icon: 'fas fa-cut' },
  { id: 'ropa',       nombre: 'Ropa',        icon: 'fas fa-tshirt' },
  { id: 'accesorios', nombre: 'Accesorios',  icon: 'fas fa-tag' },
];

  cargarProductos(): void {
    this.cargandoProductos = true;
    this.errorProductos = false;
    this.productoService.getAll().subscribe({
      next: (res) => {
        this.productosDB = res.data.filter(p => p.estado === 'activo');
        this.cargandoProductos = false;
      },
      error: () => {
        this.errorProductos = true;
        this.cargandoProductos = false;
      }
    });
  }

  verificarProductoPendiente(): void {
    const pendiente = sessionStorage.getItem('producto_pendiente_carrito');
    if (!pendiente) return;
    const usuario = this.authService.getUsuario();
    if (!usuario) return;
    sessionStorage.removeItem('producto_pendiente_carrito');
    const producto: IProducto = JSON.parse(pendiente);
    const intentar = setInterval(() => {
      if (this.productosDB.length > 0) {
        clearInterval(intentar);
        const actualizado = this.productosDB.find(p => p.id_producto === producto.id_producto);
        if (actualizado) {
          this.abrirModal(actualizado);
          setTimeout(() => this.scrollTo('productos'), 300);
        }
      }
    }, 200);
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
    this.categoriaActiva = id;
    this.productosVisibles = 4;
  }

  verMasProductos(): void { this.productosVisibles += 4; }
  verMenosProductos(): void { this.productosVisibles = 4; }

  getImagenProducto(p: IProducto): string {
    if (p.imagen?.startsWith('data:') || p.imagen?.startsWith('http') || p.imagen?.startsWith('assets/')) {
      return p.imagen;
    }
    if (p.imagen) return `${environment.apiUrl.replace(/\/api\/?$/, '/images')}/productos/${p.imagen}`;
    return 'assets/images/no-img.png';
  }

  abrirModal(producto: IProducto): void {
    this.productoSeleccionado = producto;
    this.tallaSeleccionada = '';
    this.tallaElegida = '';
    document.body.style.overflow = 'hidden';
  }

  cerrarModal(): void {
    this.productoSeleccionado = null;
    document.body.style.overflow = 'auto';
  }

  seleccionarTalla(talla: string): void { this.tallaSeleccionada = talla; }

  elegirTalla(t: string): void { this.tallaElegida = t; }

  get tallasDelProducto(): string[] {
    if (!this.productoSeleccionado?.talla) return [];
    return this.productoSeleccionado.talla.split(',').map(t => t.trim()).filter(t => t);
  }

  // ─── Carrito ──────────────────────────────────────────────
  agregarAlCarrito(producto: IProducto, event?: Event): void {
    if (event) event.stopPropagation();
    if (producto.stock === 0) return;

    const usuario = this.authService.getUsuario();
    if (!usuario) {
      sessionStorage.setItem('producto_pendiente_carrito', JSON.stringify(producto));
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/' } });
      return;
    }
    if (usuario.rol === 'admin' || usuario.rol === 'barbero') {
      this.toast.warning('Acción no disponible', 'La compra de productos es exclusiva para clientes.');
      return;
    }

    this.carritoService.agregar(producto, 1, this.tallaElegida || undefined);
    this.cerrarModal();
    this.modalCarritoVisible = true;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalCarrito(): void {
    this.modalCarritoVisible = false;
    document.body.style.overflow = 'auto';
  }

  irAlCarritoModal(): void {
    this.cerrarModalCarrito();
    this.carritoService.abrirModal();
  }

  aumentarItemModal(id: number): void {
    const item = this.itemsCarrito.find(i => i.producto.id_producto === id);
    if (item) this.carritoService.cambiarCantidad(id, item.cantidad + 1);
  }

  disminuirItemModal(id: number): void {
    const item = this.itemsCarrito.find(i => i.producto.id_producto === id);
    if (item) this.carritoService.cambiarCantidad(id, item.cantidad - 1);
  }

  formatPrecio(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v || 0);
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
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779672629/DSC00855_mpwhop.jpg', alt: 'Corte clasico' },
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779672522/DSC00511_f3oiaz.jpg', alt: 'Corte moderno' },
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779672131/DSC00226_tdcbbg.jpg', alt: 'Corte infantil' },
    ],
    [
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671279/DSC00947_fgdy7s.jpg', alt: 'Estilo urbano' },
      { tipo: 'video', src: 'assets/images/galeria/GaleVideo1.mp4', alt: 'Corte extra' },
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671277/DSC00931_daequp.jpg', alt: 'Corte con estilo' },
    ],
    [
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671152/DSC00273_exnmnd.jpg', alt: 'Arreglo de barba' },
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671272/DSC00510_t84yag.jpg', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671270/DSC00502_lr67vl.jpg', alt: 'Corte con estilo' },
    ],
    [
      { tipo: 'video', src: 'assets/images/galeria/GaleVideo4.mp4', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671269/DSC00370_r4dmbe.jpg', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671266/DSC00310_auit1h.jpg', alt: 'Corte moderno' },
    ],
    [
      { tipo: 'video', src: 'assets/images/galeria/GaleVideo3.mp4', alt: 'Corte extra' },
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671264/DSC00303_cyyei0.jpg', alt: 'Afeitado clasico' },
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671262/DSC00293_czb0qo.jpg', alt: 'Corte moderno' },
    ],
    [
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671149/DSC00252_myn3go.jpg', alt: 'Corte con estilo' },
      { tipo: 'video', src: 'assets/images/galeria/GaleVideo5.mp4', alt: 'Corte con estilo' },
      { tipo: 'imagen', src: 'https://res.cloudinary.com/dec5ya9i9/image/upload/v1779671267/DSC00339_khznkh.jpg', alt: 'Corte con estilo' },
    ],
  ];

  galeriaVisible = 6;

  get galeriaItemsTodos() {
    return this.galeriaColumnas.flat();
  }

  get galeriaItemsTodosReverse() {
    return [...this.galeriaColumnas.flat()].reverse();
  }

  get hayMasGaleria(): boolean {
    if (this.esMobil()) {
      const total = this.galeriaColumnas.reduce((acc, col) => acc + col.length, 0);
      return this.galeriaVisible < total;
    }
    return this.galeriaVisible < this.galeriaColumnas.length;
  }

  verMasGaleria(): void { this.galeriaVisible += 6; }
  verMenosGaleria(): void { this.galeriaVisible = 6; }

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
    const scrollAmount = track.clientWidth;
    track.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
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
