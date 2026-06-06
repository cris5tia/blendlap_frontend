import { Component, OnInit } from '@angular/core';
import { ProductoService, IProducto, ICrearProducto } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';

type VistaModal = 'crear' | 'editar' | 'movimiento' | 'movimientos' | null;

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss']
})
export class ProductosComponent implements OnInit {

  productos: IProducto[] = [];
  productosFiltrados: IProducto[] = [];
  movimientos: any[] = [];

  cargando = true;
  error = '';
  busqueda = '';
  filtroCategoria = '';
  filtroEstado = '';

  modalVista: VistaModal = null;
  productoSeleccionado: IProducto | null = null;
  guardando = false;

  // Imagen
  imagenFile: File | null = null;
  imagenPreview: string | null = null;

  categoriaOpen = false;
  categorias = ['barberia', 'ropa', 'accesorios', 'cuidado'];
  tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '41', '42', '43', '44', 'Única'];

  form: ICrearProducto = this.formVacio();
  movimientoForm = {
    id_producto: 0,
    tipo_movimiento: 'Entrada' as 'Entrada' | 'Salida',
    cantidad: 1,
    motivo: ''
  };

  constructor(
    private productoService: ProductoService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (window.innerWidth <= 768) {
      this.filtroCategoria = 'barberia';
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.productoService.getAll().subscribe({
      next: (res) => {
        this.productos = res.data;
        this.filtrar();
        this.cargando = false;
      },
      error: () => { this.toastService.error('Error al cargar productos'); this.cargando = false; }
    });
  }

  filtrar(): void {
    let lista = [...this.productos];
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(p =>
        p.nombre_producto.toLowerCase().includes(q) ||
        p.codigo_producto.toLowerCase().includes(q)
      );
    }
    if (this.filtroCategoria) lista = lista.filter(p => p.categoria === this.filtroCategoria);
    if (this.filtroEstado)    lista = lista.filter(p => p.estado    === this.filtroEstado);
    this.productosFiltrados = lista;
  }

  // ─── Imagen ───────────────────────────────────────────────
  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.imagenFile = input.files[0];
    if (this.imagenFile.size > 5 * 1024 * 1024) {
      this.error = 'La imagen no puede pesar mas de 5MB';
      this.imagenFile = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagenPreview = e.target?.result as string;
      this.form.imagen = this.imagenPreview;
    };
    reader.readAsDataURL(this.imagenFile);
  }

  getImagenProducto(p: IProducto): string {
    if (!p.imagen) return 'assets/images/no-img.png';
    return p.imagen;
  }

  limpiarImagen(): void {
    this.imagenFile = null;
    this.imagenPreview = null;
    this.form.imagen = '';
  }

  // ─── Modales ──────────────────────────────────────────────
  abrirCrear(): void {
    this.form = this.formVacio();
    this.limpiarImagen();
    this.error = '';
    this.modalVista = 'crear';
  }

  abrirEditar(p: IProducto): void {
    this.productoSeleccionado = p;
    this.form = {
      codigo_producto: p.codigo_producto,
      nombre_producto: p.nombre_producto,
      descripcion:     p.descripcion || '',
      precio:          p.precio,
      stock:           p.stock,
      categoria:       p.categoria,
      talla:           p.talla || '',
      imagen:          p.imagen || '',
    };
    this.imagenFile = null;
    this.imagenPreview = p.imagen || null;
    this.error = '';
    this.modalVista = 'editar';
  }

  abrirMovimiento(p: IProducto): void {
    this.productoSeleccionado = p;
    this.movimientoForm = { id_producto: p.id_producto, tipo_movimiento: 'Entrada', cantidad: 1, motivo: '' };
    this.error = '';
    this.modalVista = 'movimiento';
  }

  abrirMovimientos(p: IProducto): void {
    this.productoSeleccionado = p;
    this.movimientos = [];
    this.modalVista = 'movimientos';
    this.productoService.getMovimientos(p.id_producto).subscribe({
      next: (res) => this.movimientos = res.data,
      error: () => this.error = 'Error al cargar movimientos'
    });
  }

  cerrarModal(): void {
    this.modalVista = null;
    this.productoSeleccionado = null;
    this.categoriaOpen = false;
    this.limpiarImagen();
    this.error = '';
  }

  // ─── Guardar ──────────────────────────────────────────────
  guardar(): void {
    this.guardando = true;
    this.error = '';

    const data: ICrearProducto = {
      ...this.form,
      imagen: this.form.imagen ?? '',
    };

    const esEditar   = this.modalVista === 'editar';
    const idProducto = this.productoSeleccionado?.id_producto;
    const op = esEditar
      ? this.productoService.update(idProducto!, data)
      : this.productoService.create(data);

    op.subscribe({
      next: () => {
        this.toastService.success(esEditar ? 'Producto actualizado' : 'Producto creado');
        this.cerrarModal();
        this.cargar();
        this.guardando = false;
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error al guardar';
        this.guardando = false;
      }
    });
  }

  guardarMovimiento(): void {
    this.guardando = true;
    this.productoService.registrarMovimiento(this.movimientoForm).subscribe({
      next: (res) => {
        const msg = `Stock actual: ${res.stock_actual}` + (res.alerta_stock_bajo ? ' — stock bajo' : '');
        this.toastService.success('Movimiento registrado', msg);
        this.cerrarModal();
        this.cargar();
        this.guardando = false;
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error al registrar movimiento';
        this.guardando = false;
      }
    });
  }

  eliminar(p: IProducto): void {
    if (!confirm(`¿Eliminar "${p.nombre_producto}"?`)) return;
    this.productoService.delete(p.id_producto).subscribe({
      next: () => {
        this.toastService.success('Producto eliminado');
        this.cargar();
      },
      error: (err) => this.toastService.error('Error al eliminar', err?.error?.mensaje || 'Error inesperado')
    });
  }

  // ─── Utils ────────────────────────────────────────────────
  get stockBajoCount(): number {
    return this.productos.filter(p => p.stock <= 5).length;
  }

  categoriaLabel(cat: string): string {
    const map: any = { barberia: 'Barbería', ropa: 'Ropa', accesorios: 'Accesorios', cuidado: 'Cuidado' };
    return map[cat] || cat;
  }

  categoriaIcon(cat: string): string {
    const icons: any = { barberia: 'fa-cut', ropa: 'fa-tshirt', accesorios: 'fa-tag', cuidado: 'fa-leaf' };
    return icons[cat] || 'fa-box';
  }

  countByCategoria(cat: string): number {
    return this.productos.filter(p => p.categoria === cat).length;
  }

  setCategoria(cat: string): void { this.filtroCategoria = cat; this.filtrar(); }
  setEstado(e: string): void      { this.filtroEstado = e;       this.filtrar(); }

  tieneStock(p: IProducto): boolean { return p.stock > 5; }
  stockMedio(p: IProducto): boolean { return p.stock > 0 && p.stock <= 5; }
  sinStock(p: IProducto): boolean   { return p.stock === 0; }

  formVacio(): ICrearProducto {
    return {
      codigo_producto: '',
      nombre_producto: '',
      descripcion:     '',
      precio:          0,
      stock:           0,
      categoria:       'barberia',
      talla:           ''
    };
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(v || 0);
  }
}
