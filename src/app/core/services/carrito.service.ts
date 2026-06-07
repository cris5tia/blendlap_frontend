import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IProducto } from './producto.service';

export interface IItemCarrito {
  producto: IProducto;
  cantidad: number;
  talla?: string;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {

  private itemsSubject = new BehaviorSubject<IItemCarrito[]>(this.cargarStorage());
  private modalSubject = new BehaviorSubject<boolean>(false);

  items$ = this.itemsSubject.asObservable();
  modal$ = this.modalSubject.asObservable();

  get items(): IItemCarrito[] {
    return this.itemsSubject.getValue();
  }

  get total(): number {
    return this.items.reduce((sum, i) => sum + (Number(i.producto.precio) * i.cantidad), 0);
  }

  get cantidad(): number {
    return this.items.length;
  }

  agregar(producto: IProducto, cantidad: number = 1, talla?: string): void {
    const items = [...this.items];
    const existe = items.find(i =>
      i.producto.id_producto === producto.id_producto && i.talla === talla
    );
    if (existe) {
      existe.cantidad = Math.min(existe.cantidad + cantidad, producto.stock);
    } else {
      items.push({ producto, cantidad, talla });
    }
    this.actualizar(items);
  }

  quitar(id_producto: number): void {
    this.actualizar(this.items.filter(i => i.producto.id_producto !== id_producto));
  }

  cambiarCantidad(id_producto: number, cantidad: number): void {
    const items = [...this.items];
    const item = items.find(i => i.producto.id_producto === id_producto);
    if (!item) return;
    if (cantidad < 1) return;
    item.cantidad = Math.min(cantidad, item.producto.stock);
    this.actualizar(items);
  }

  limpiar(): void { this.actualizar([]); }

  abrirModal(): void { this.modalSubject.next(true); document.body.style.overflow = 'hidden'; }
  cerrarModal(): void { this.modalSubject.next(false); document.body.style.overflow = ''; }
  toggleModal(): void {
    const estado = this.modalSubject.getValue();
    estado ? this.cerrarModal() : this.abrirModal();
  }

  private actualizar(items: IItemCarrito[]): void {
    this.itemsSubject.next(items);
    try { localStorage.setItem('carrito_blendlap', JSON.stringify(items)); } catch { }
  }

  private cargarStorage(): IItemCarrito[] {
    try {
      const data = localStorage.getItem('carrito_blendlap');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }
}
