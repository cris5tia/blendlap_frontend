import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PagoService } from '../../../core/services/pago.service';
import { CarritoService } from '../../../core/services/carrito.service';

type EstadoPago = 'verificando' | 'aprobado' | 'rechazado' | 'error';

@Component({
  selector: 'app-pago-resultado',
  templateUrl: './pago-resultado.component.html',
  styleUrls: ['./pago-resultado.component.scss']
})
export class PagoResultadoComponent implements OnInit, OnDestroy {

  estado: EstadoPago = 'verificando';
  transactionId  = '';
  referencia     = '';
  idVenta: number | null = null;
  mensaje        = '';
  private timer: any;

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private pagoService:    PagoService,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    // Si Wompi redirigió a un túnel/dominio externo, redirigir a localhost preservando params
    if (window.location.hostname !== 'localhost') {
      window.location.href = `${window.location.origin}/pago/resultado${window.location.search}`;
      return;
    }

    this.transactionId = this.route.snapshot.queryParamMap.get('id') || '';

    if (!this.transactionId) {
      this.estado  = 'error';
      this.mensaje = 'No se recibió el ID de la transacción';
      return;
    }

    this.verificar();
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  private verificar(): void {
    this.pagoService.verificarPago(this.transactionId).subscribe({
      next: (res) => {
        if (res.ok && res.estado === 'aprobado') {
          this.estado    = 'aprobado';
          this.referencia = res.referencia || '';
          this.idVenta    = res.idVenta    || null;
          this.carritoService.limpiar();
          sessionStorage.removeItem('wompi_referencia');
        } else if (res.estado === 'rechazado') {
          this.estado  = 'rechazado';
          this.mensaje = 'Tu pago fue rechazado. Intenta con otro método.';
        } else {
          this.estado  = 'error';
          this.mensaje = res.mensaje || 'Error al procesar el pago';
        }
      },
      error: (err) => {
        this.estado  = 'error';
        this.mensaje = err.error?.mensaje || 'No se pudo verificar la transacción';
      }
    });
  }

  irAMisCompras(): void {
    this.router.navigate(['/cliente/perfil'], { queryParams: { tab: 'compras' } });
  }
}
