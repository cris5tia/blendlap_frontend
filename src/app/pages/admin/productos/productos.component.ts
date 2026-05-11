import { Component, OnInit } from '@angular/core';
import { ProductoService, IProducto, ICrearProducto } from '../../../core/services/producto.service';

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
  exito = '';

  busqueda = '';
  filtroCategoria = '';
  filtroEstado = '';

  modalVista: VistaModal = null;
  productoSeleccionado: IProducto | null = null;
  guardando = false;

  categorias = ['barberia', 'ropa', 'accesorios', 'cuidado'];
  tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  form: ICrearProducto = this.formVacio();
  movimientoForm = { id_producto: 0, tipo_movimiento: 'Entrada' as 'Entrada' | 'Salida', cantidad: 1, motivo: '' };

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.productoService.getAll().subscribe({
      next: (res) => {
        this.productos = res.data;
        this.filtrar();
        this.cargando = false;
      },
      error: () => { this.error = 'Error al cargar productos'; this.cargando = false; }
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
    if (this.filtroEstado)    lista = lista.filter(p => p.estado === this.filtroEstado);
    this.productosFiltrados = lista;
  }

  abrirCrear(): void {
    this.form = this.formVacio();
    this.error = '';
    this.modalVista = 'crear';
  }

  abrirEditar(p: IProducto): void {
    this.productoSeleccionado = p;
    this.form = {
      codigo_producto: p.codigo_producto,
      nombre_producto: p.nombre_producto,
      descripcion: p.descripcion || '',
      precio: p.precio,
      stock: p.stock,
      categoria: p.categoria,
      talla: p.talla || '',
    };
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

  cerrarModal(): void { this.modalVista = null; this.productoSeleccionado = null; this.error = ''; }

  guardar(): void {
    this.guardando = true;
    this.error = '';
    const op = this.modalVista === 'crear'
      ? this.productoService.create(this.form)
      : this.productoService.update(this.productoSeleccionado!.id_producto, this.form);

    op.subscribe({
      next: () => {
        this.exito = this.modalVista === 'crear' ? 'Producto creado' : 'Producto actualizado';
        this.cerrarModal();
        this.cargar();
        this.guardando = false;
        setTimeout(() => this.exito = '', 3000);
      },
      error: (err) => { this.error = err.error?.mensaje || 'Error al guardar'; this.guardando = false; }
    });
  }

  guardarMovimiento(): void {
    this.guardando = true;
    this.productoService.registrarMovimiento(this.movimientoForm).subscribe({
      next: (res) => {
        this.exito = `Movimiento registrado. Stock actual: ${res.stock_actual}`;
        if (res.alerta_stock_bajo) this.exito += ' ⚠️ Stock bajo';
        this.cerrarModal();
        this.cargar();
        this.guardando = false;
        setTimeout(() => this.exito = '', 4000);
      },
      error: (err) => { this.error = err.error?.mensaje || 'Error al registrar movimiento'; this.guardando = false; }
    });
  }

  eliminar(p: IProducto): void {
    if (!confirm(`¿Eliminar "${p.nombre_producto}"?`)) return;
    this.productoService.delete(p.id_producto).subscribe({
      next: () => { this.exito = 'Producto eliminado'; this.cargar(); setTimeout(() => this.exito = '', 3000); },
      error: (err) => this.error = err.error?.mensaje || 'Error al eliminar'
    });
  }

  get stockBajoCount(): number {
    return this.productos.filter(p => p.stock <= 5).length;
  }

  categoriaLabel(cat: string): string {
    const map: any = { barberia: 'Barbería', ropa: 'Ropa', accesorios: 'Accesorios', cuidado: 'Cuidado' };
    return map[cat] || cat;
  }

  tieneStock(p: IProducto): boolean { return p.stock > 5; }
  stockMedio(p: IProducto): boolean { return p.stock > 0 && p.stock <= 5; }
  sinStock(p: IProducto): boolean   { return p.stock === 0; }

  formVacio(): ICrearProducto {
    return { codigo_producto: '', nombre_producto: '', descripcion: '', precio: 0, stock: 0, categoria: 'barberia', talla: '' };
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);
  }
}