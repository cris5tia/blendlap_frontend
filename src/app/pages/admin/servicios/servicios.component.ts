import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ServicioService, IServicio } from '../../../core/services/servicio.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-servicios',
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.scss']
})
export class ServiciosComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  servicios: IServicio[] = [];
  serviciosFiltrados: IServicio[] = [];
  busqueda = '';
  filtroEstado: 'todos' | 'activo' | 'inactivo' = 'activo';
  cargando = false;

  modalVisible = false;
  editando = false;
  formulario: IServicio = this.formularioVacio();
  guardando = false;


  categoriaOpen = false;

  archivoSeleccionado: File | null = null;
  previewImagen: string = '';

  constructor(
    private servicioService: ServicioService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.cargando = true;
    this.servicioService.getAll().subscribe({
      next: (res) => {
        this.servicios = res.data;
        this.serviciosFiltrados = [...this.servicios];
        this.cargando = false;
      },
      error: () => {
        this.toastService.error('Error al cargar los servicios');
        this.cargando = false;
      }
    });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.serviciosFiltrados = this.servicios.filter(s => {
      const coincideBusqueda = !q || s.nombre_servicio.toLowerCase().includes(q);
      const coincideEstado = this.filtroEstado === 'todos' || s.estado === this.filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }

  setFiltroEstado(estado: 'todos' | 'activo' | 'inactivo'): void {
    this.filtroEstado = estado;
    this.filtrar();
  }

  get countActivos(): number { return this.servicios.filter(s => s.estado === 'activo').length; }
  get countInactivos(): number { return this.servicios.filter(s => s.estado === 'inactivo').length; }

  abrirModal(servicio?: IServicio): void {
    this.editando = !!servicio;
    this.formulario = servicio ? { ...servicio } : this.formularioVacio();
    this.archivoSeleccionado = null;
    this.previewImagen = servicio?.imagen ?? '';
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.archivoSeleccionado = null;
    this.previewImagen = '';
  }

  seleccionarImagen(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
      this.fileInput.nativeElement.click();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.archivoSeleccionado = input.files[0];
    if (this.archivoSeleccionado.size > 5 * 1024 * 1024) {
      this.toastService.error('La imagen no puede pesar más de 5MB');
      this.archivoSeleccionado = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImagen = e.target?.result as string;
      this.formulario.imagen = this.previewImagen;
    };
    reader.readAsDataURL(this.archivoSeleccionado);
  }

  guardar(): void {
    this.guardando = true;
    this.guardarServicio();
  }

  private guardarServicio(): void {
    const { id_servicio, ...data } = this.formulario;

    if (this.editando && id_servicio) {
      this.servicioService.update(Number(id_servicio), data).subscribe({
        next: (res) => {
          const idx = this.servicios.findIndex(s => s.id_servicio === id_servicio);
          if (idx !== -1) this.servicios[idx] = res.data;
          this.filtrar();
          this.guardando = false;
          this.cerrarModal();
          this.toastService.success('Servicio actualizado');
        },
        error: () => {
          this.toastService.error('Error al actualizar el servicio');
          this.guardando = false;
        }
      });
    } else {
      this.servicioService.create(data).subscribe({
        next: (res) => {
          this.servicios.push(res.data);
          this.filtrar();
          this.guardando = false;
          this.cerrarModal();
          this.toastService.success('Servicio creado exitosamente');
        },
        error: () => {
          this.toastService.error('Error al crear el servicio');
          this.guardando = false;
        }
      });
    }
  }


  private formularioVacio(): IServicio {
    return { nombre_servicio: '', descripcion: '', precio: 0, duracion: 30, imagen: '', categoria: '' };
  }
  /* ACTIVO/INACTIVO SERVICIOS  */
  modalEstado = false;
  servicioEstado: IServicio | null = null;
  cambiandoEstado = false;

  confirmarCambioEstado(servicio: IServicio): void {
    this.servicioEstado = servicio;
    this.modalEstado = true;
  }

  cambiarEstado(): void {
    if (!this.servicioEstado?.id_servicio) return;
    this.cambiandoEstado = true;
    const nuevoEstado = this.servicioEstado.estado === 'activo' ? 'inactivo' : 'activo';
    this.servicioService.cambiarEstado(Number(this.servicioEstado.id_servicio), nuevoEstado).subscribe({
      next: () => {
        const idx = this.servicios.findIndex(s => s.id_servicio === this.servicioEstado!.id_servicio);
        if (idx !== -1) this.servicios[idx] = { ...this.servicios[idx], estado: nuevoEstado };
        this.filtrar();
        this.cambiandoEstado = false;
        this.modalEstado = false;
        this.servicioEstado = null;
        this.toastService.success(nuevoEstado === 'activo' ? 'Servicio activado' : 'Servicio inactivado');
      },
      error: () => {
        this.toastService.error('Error al cambiar el estado del servicio');
        this.cambiandoEstado = false;
      }
    });
  }
  
}
