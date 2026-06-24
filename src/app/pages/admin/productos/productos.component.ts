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

  modalDesactivar = false;
  productoDesactivar: IProducto | null = null;
  procesandoEstado = false;

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
    this.cargar(true);
  }

  cargar(avisarStockBajo = false): void {
    this.cargando = true;
    this.productoService.getAll().subscribe({
      next: (res) => {
        this.productos = res.data;
        this.filtrar();
        this.cargando = false;
        if (avisarStockBajo) {
          const bajos = this.productos.filter(p => p.stock <= 5 && p.stock > 0 && p.estado === 'activo');
          const agotados = this.productos.filter(p => p.stock === 0 && p.estado === 'activo');
          if (agotados.length > 0)
            this.toastService.error(`${agotados.length} producto${agotados.length > 1 ? 's' : ''} agotado${agotados.length > 1 ? 's' : ''}`,
              agotados.map(p => p.nombre_producto).join(', '));
          if (bajos.length > 0)
            this.toastService.warning(`${bajos.length} producto${bajos.length > 1 ? 's' : ''} con stock bajo`,
              bajos.map(p => `${p.nombre_producto}: ${p.stock} uds`).join(' · '));
        }
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
      this.toastService.warning('Imagen demasiado pesada', 'La imagen no puede pesar mas de 5MB');
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
      error: () => {
        this.error = 'Error al cargar movimientos';
        this.toastService.error('Error al cargar movimientos');
      }
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
        this.toastService.success(esEditar ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
        this.cerrarModal();
        this.cargar();
        this.guardando = false;
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error al guardar';
        this.toastService.error(
          esEditar ? 'Error al actualizar producto' : 'Error al crear producto',
          this.error
        );
        this.guardando = false;
      }
    });
  }

  guardarMovimiento(): void {
    this.guardando = true;
    this.productoService.registrarMovimiento(this.movimientoForm).subscribe({
      next: (res) => {
        this.toastService.success('Movimiento registrado', `Stock actual: ${res.stock_actual} uds`);
        if (res.alerta_stock_bajo && res.stock_actual > 0)
          this.toastService.warning('Stock bajo', `Quedan solo ${res.stock_actual} unidades`);
        if (res.stock_actual === 0)
          this.toastService.error('Producto agotado', 'El stock llegó a 0 unidades');
        this.cerrarModal();
        this.cargar();
        this.guardando = false;
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error al registrar movimiento';
        this.toastService.error('Error al registrar movimiento', this.error);
        this.guardando = false;
      }
    });
  }

  confirmarCambioEstado(p: IProducto): void {
    this.productoDesactivar = p;
    this.modalDesactivar = true;
  }

  cambiarEstadoProducto(): void {
    if (!this.productoDesactivar) return;
    this.procesandoEstado = true;
    const nuevoEstado = this.productoDesactivar.estado === 'activo' ? 'inactivo' : 'activo';
    this.productoService.update(this.productoDesactivar.id_producto, { estado: nuevoEstado } as any).subscribe({
      next: () => {
        const idx = this.productos.findIndex(p => p.id_producto === this.productoDesactivar!.id_producto);
        if (idx !== -1) this.productos[idx] = { ...this.productos[idx], estado: nuevoEstado };
        this.filtrar();
        this.toastService.success(nuevoEstado === 'activo' ? 'Producto activado' : 'Producto desactivado');
        this.modalDesactivar = false;
        this.productoDesactivar = null;
        this.procesandoEstado = false;
      },
      error: () => {
        this.toastService.error('Error al cambiar el estado del producto');
        this.procesandoEstado = false;
      }
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
