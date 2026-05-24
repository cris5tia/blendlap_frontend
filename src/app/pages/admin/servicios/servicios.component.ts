import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ServicioService, IServicio } from '../../../core/services/servicio.service';

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
  cargando = false;
  error = '';

  modalVisible = false;
  editando = false;
  formulario: IServicio = this.formularioVacio();
  guardando = false;

  modalEliminar = false;
  servicioAEliminar: IServicio | null = null;
  eliminando = false;

  archivoSeleccionado: File | null = null;
  previewImagen: string = '';

  constructor(private servicioService: ServicioService) { }

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.cargando = true;
    this.error = '';
    this.servicioService.getAll().subscribe({
      next: (res) => {
        this.servicios = res.data;
        this.serviciosFiltrados = [...this.servicios];
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar los servicios';
        this.cargando = false;
      }
    });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.serviciosFiltrados = q
      ? this.servicios.filter(s =>
        s.nombre_servicio.toLowerCase().includes(q)
      )
      : [...this.servicios];
  }

  abrirModal(servicio?: IServicio): void {
    this.editando = !!servicio;
    this.formulario = servicio ? { ...servicio } : this.formularioVacio();
    this.archivoSeleccionado = null;
    this.previewImagen = servicio?.imagen
      ? `http://localhost:3001/images/servicios/${servicio.imagen}`
      : '';
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

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImagen = e.target?.result as string;
    };
    reader.readAsDataURL(this.archivoSeleccionado);
  }

  guardar(): void {
    this.guardando = true;

    if (this.archivoSeleccionado) {
      this.servicioService.uploadImagen(this.archivoSeleccionado).subscribe({
        next: (res) => {
          this.formulario.imagen = res.nombreArchivo;
          this.archivoSeleccionado = null;
          this.guardarServicio();
        },
        error: () => {
          this.error = 'Error al subir la imagen';
          this.guardando = false;
        }
      });
    } else {
      this.guardarServicio();
    }
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
        },
        error: () => {
          this.error = 'Error al actualizar el servicio';
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
        },
        error: () => {
          this.error = 'Error al crear el servicio';
          this.guardando = false;
        }
      });
    }
  }

  confirmarEliminar(servicio: IServicio): void {
    this.servicioAEliminar = servicio;
    this.modalEliminar = true;
  }

  eliminar(): void {
    if (!this.servicioAEliminar?.id_servicio) return;
    this.eliminando = true;
    const id = Number(this.servicioAEliminar.id_servicio);
    this.servicioService.delete(id).subscribe({
      next: () => {
        this.servicios = this.servicios.filter(s => s.id_servicio !== this.servicioAEliminar!.id_servicio);
        this.filtrar();
        this.eliminando = false;
        this.modalEliminar = false;
        this.servicioAEliminar = null;
      },
      error: () => {
        this.error = 'Error al eliminar el servicio';
        this.eliminando = false;
      }
    });
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
      },
      error: () => { this.cambiandoEstado = false; }
    });
  }
  
}