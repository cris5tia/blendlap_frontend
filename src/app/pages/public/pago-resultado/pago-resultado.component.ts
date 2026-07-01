import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PagoService } from '../../../core/services/pago.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { environment } from '../../../../environments/environment';

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
  private reintentos = 0;
  private readonly MAX_REINTENTOS = 5;

  constructor(
    private route:          ActivatedRoute,
    private pagoService:    PagoService,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    this.transactionId = this.route.snapshot.queryParamMap.get('id') || '';

    if (!this.transactionId) {
      this.estado  = 'error';
      this.mensaje = 'No se recibio el ID de la transaccion';
      return;
    }

    // Dar tiempo a Wompi para registrar la transacción antes de verificar
    this.timer = setTimeout(() => this.verificar(), 2000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  private verificar(): void {
    this.pagoService.verificarPago(this.transactionId).subscribe({
      next: (res) => {
        if (res.ok && res.estado === 'aprobado') {
          this.estado     = 'aprobado';
          this.referencia = res.referencia || '';
          this.idVenta    = res.idVenta    || null;
          this.carritoService.limpiar();
          sessionStorage.removeItem('wompi_referencia');
        } else if (res.estado === 'rechazado') {
          this.estado  = 'rechazado';
          this.mensaje = res.mensaje || 'Tu pago fue rechazado. Intenta con otro metodo.';
        } else if (res.estado === 'pendiente' && this.reintentos < this.MAX_REINTENTOS) {
          // Wompi aún procesando — reintentar en 3s
          this.reintentos++;
          this.timer = setTimeout(() => this.verificar(), 3000);
        } else {
          this.estado  = 'error';
          this.mensaje = res.mensaje || 'No se pudo verificar la transaccion';
        }
      },
      error: (err) => {
        this.estado  = 'error';
        this.mensaje = err.error?.mensaje || 'No se pudo verificar la transaccion';
      }
    });
  }

  irAMisCompras(): void {
    window.location.href = `${environment.appUrl}/cliente/perfil?tab=compras`;
  }

  irABlendlap(): void {
    window.location.href = environment.appUrl;
  }
}
