import { Component, OnInit } from '@angular/core';
import { GastoService, IGasto } from '../../../core/services/gasto.service';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.scss']
})
export class GastosComponent implements OnInit {

  gastos: IGasto[] = [];
  cargando = false;
  error = '';
  guardando = false;

  modalVisible = false;
  editando = false;
  formulario: IGasto = this.formularioVacio();

  modalEliminar = false;
  gastoAEliminar: IGasto | null = null;
  eliminando = false;

  filtros = { desde: '', hasta: '', categoria: '' };

  categorias = [
    'Arriendo', 'Servicios públicos', 'Internet', 'Productos',
    'Mantenimiento', 'Nómina', 'Marketing', 'Equipos', 'Otros'
  ];

  get totalGastos(): number {
    return this.gastos.reduce((sum, g) => sum + Number(g.monto), 0);
  }

  get gastosPorCategoria(): { categoria: string; total: number }[] {
    const mapa: { [key: string]: number } = {};
    this.gastos.forEach(g => {
      mapa[g.categoria] = (mapa[g.categoria] || 0) + Number(g.monto);
    });
    return Object.entries(mapa)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }

  constructor(private gastoService: GastoService) {}

  ngOnInit(): void {
    this.cargarGastos();
  }

  cargarGastos(): void {
    this.cargando = true;
    this.gastoService.getAll(this.filtros).subscribe({
      next: (res) => {
        this.gastos = res.data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar gastos';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarGastos();
  }

  limpiarFiltros(): void {
    this.filtros = { desde: '', hasta: '', categoria: '' };
    this.cargarGastos();
  }

  abrirModal(gasto?: IGasto): void {
    this.editando = !!gasto;
    this.formulario = gasto ? { ...gasto } : this.formularioVacio();
    this.modalVisible = true;
    this.error = '';
  }

  cerrarModal(): void {
    this.modalVisible = false;
  }

  guardar(): void {
    if (!this.formulario.nombre || !this.formulario.categoria || !this.formulario.monto || !this.formulario.fecha) {
      this.error = 'Completa todos los campos requeridos';
      return;
    }

    this.guardando = true;
    this.error = '';

    if (this.editando && this.formulario.id_gasto) {
      const { id_gasto, ...data } = this.formulario;
      this.gastoService.actualizar(id_gasto, data).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.cargarGastos();
        },
        error: () => {
          this.error = 'Error al actualizar gasto';
          this.guardando = false;
        }
      });
    } else {
      this.gastoService.crear(this.formulario).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.cargarGastos();
        },
        error: () => {
          this.error = 'Error al crear gasto';
          this.guardando = false;
        }
      });
    }
  }

  confirmarEliminar(gasto: IGasto): void {
    this.gastoAEliminar = gasto;
    this.modalEliminar = true;
  }

  eliminar(): void {
    if (!this.gastoAEliminar?.id_gasto) return;
    this.eliminando = true;
    this.gastoService.eliminar(this.gastoAEliminar.id_gasto).subscribe({
      next: () => {
        this.gastos = this.gastos.filter(g => g.id_gasto !== this.gastoAEliminar!.id_gasto);
        this.eliminando = false;
        this.modalEliminar = false;
        this.gastoAEliminar = null;
      },
      error: () => {
        this.error = 'Error al eliminar gasto';
        this.eliminando = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  private formularioVacio(): IGasto {
    const hoy = new Date().toISOString().split('T')[0];
    return {
      nombre: '',
      categoria: '',
      monto: 0,
      fecha: hoy,
      descripcion: ''
    };
  }
}