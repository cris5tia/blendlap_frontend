import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BarberoService, IBarbero } from '../../../core/services/barbero.service';
import { ToastService } from '../../../core/services/toast.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-barberos',
  templateUrl: './barberos.component.html',
  styleUrls: ['./barberos.component.scss']
})
export class BarberosComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  barberos: IBarbero[] = [];
  cargando = false;

  modalVisible = false;
  editando = false;
  guardando = false;
  formulario: any = this.formularioVacio();

  modalEliminar = false;
  barberoAEliminar: IBarbero | null = null;
  eliminando = false;

  archivoSeleccionado: File | null = null;
  previewFoto: string = '';

  constructor(
    private barberoService: BarberoService,
    private toastService: ToastService,
    private socketService: SocketService
  ) { }

  ngOnInit(): void {
    this.cargarBarberos();
    this.socketService.connect();
    this.socketService.onReservaActualizada()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarBarberos());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarBarberos(): void {
    this.cargando = true;
    this.barberoService.getAllAdmin().subscribe({
      next: (res) => {
        this.barberos = res.data;
        this.barberosFiltrados = [...this.barberos];
        this.cargando = false;
      },
      error: () => {
        this.toastService.error('Error al cargar barberos');
        this.cargando = false;
      }
    });
  }
  reactivar(barbero: IBarbero): void {
    this.barberoService.reactivar(Number(barbero.id_usuario)).subscribe({
      next: () => {
        const idx = this.barberos.findIndex(b => b.id_usuario === barbero.id_usuario);
        if (idx !== -1) this.barberos[idx] = { ...this.barberos[idx], estado: 'activo' };
        this.filtrar();
        this.toastService.success('Barbero activado');
      },
      error: () => this.toastService.error('Error al reactivar barbero')
    });
  }

  abrirModal(barbero?: IBarbero): void {
    this.editando = !!barbero;
    this.formulario = barbero ? { ...barbero } : this.formularioVacio();
    this.archivoSeleccionado = null;
    this.previewFoto = barbero?.foto ?? '';
    this.modalVisible = true;
    setTimeout(() => {
      const ta = document.querySelector<HTMLTextAreaElement>('.modal__body textarea[name="descripcion"]');
      if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
    }, 50);
  }

  autoResize(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.archivoSeleccionado = null;
    this.previewFoto = '';
  }

  seleccionarFoto(): void {
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
    reader.onload = (e) => this.previewFoto = e.target?.result as string;
    reader.readAsDataURL(this.archivoSeleccionado);
  }

  guardar(): void {
    this.guardando = true;

    if (this.archivoSeleccionado) {
      const idBarbero = this.editando ? this.formulario.id_usuario : undefined;
      this.barberoService.uploadFoto(this.archivoSeleccionado, idBarbero).subscribe({
        next: (res) => {
          this.formulario.foto = res.nombreArchivo;
          this.archivoSeleccionado = null;
          this.guardarBarbero();
        },
        error: () => {
          this.toastService.error('Error al subir la foto');
          this.guardando = false;
        }
      });
    } else {
      this.guardarBarbero();
    }
  }

  private guardarBarbero(): void {
    if (this.editando) {
      const { id_usuario, ...data } = this.formulario;
      this.barberoService.actualizar(Number(id_usuario), data).subscribe({
        next: (res) => {
          const idx = this.barberos.findIndex(b => b.id_usuario === id_usuario);
          if (idx !== -1) this.barberos[idx] = { ...this.barberos[idx], ...res.data };
          this.filtrar();
          this.guardando = false;
          this.cerrarModal();
          this.toastService.success('Barbero actualizado');
        },
        error: () => {
          this.toastService.error('Error al actualizar barbero');
          this.guardando = false;
        }
      });
    } else {
      this.barberoService.crear(this.formulario).subscribe({
        next: (res) => {
          this.barberos.push(res.data);
          this.filtrar();
          this.guardando = false;
          this.cerrarModal();
          this.toastService.success('Barbero creado');
        },
        error: (err) => {
          this.toastService.error(err?.error?.mensaje || 'Error al crear barbero');
          this.guardando = false;
        }
      });
    }
  }

  confirmarEliminar(barbero: IBarbero): void {
    this.barberoAEliminar = barbero;
    this.modalEliminar = true;
  }

  eliminar(): void {
    if (!this.barberoAEliminar) return;
    this.eliminando = true;
    const id = this.barberoAEliminar.id_usuario;
    this.barberoService.eliminar(Number(id)).subscribe({
      next: () => {
        const idx = this.barberos.findIndex(b => b.id_usuario === id);
        if (idx !== -1) this.barberos[idx] = { ...this.barberos[idx], estado: 'inactivo' };
        this.filtrar();
        this.eliminando = false;
        this.modalEliminar = false;
        this.barberoAEliminar = null;
        this.toastService.success('Barbero desactivado');
      },
      error: (err) => {
        this.toastService.error(err?.error?.mensaje || 'Error al desactivar barbero');
        this.eliminando = false;
      }
    });
  }

  getEstrellas(promedio: number): number[] {
    return Array(Math.floor(promedio)).fill(0);
  }

  private formularioVacio() {
    return {
      nombre: '',
      apellido: '',
      correo_electronico: '',
      contrasena: '',
      titulo: '',
      especialidades: '',
      descripcion: '',
      foto: '',
      experiencia: 0,
      comision: 0
    };
  }
  barberosFiltrados: IBarbero[] = [];
  busqueda = '';

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.barberosFiltrados = q
      ? this.barberos.filter(b =>
        b.nombre.toLowerCase().includes(q) ||
        b.apellido.toLowerCase().includes(q)
      )
      : [...this.barberos];
  }
}
