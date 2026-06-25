import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { HomeComponent } from './pages/public/home/home.component';
import { LoginComponent } from './pages/public/login/login.component';
import { RegistroComponent } from './pages/public/registro/registro.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ReservasComponent } from './pages/admin/reservas/reservas.component';
import { ClientesComponent } from './pages/admin/clientes/clientes.component';
import { ServiciosComponent } from './pages/admin/servicios/servicios.component';
import { ProductosComponent } from './pages/admin/productos/productos.component';
import { VentasComponent } from './pages/admin/ventas/ventas.component';
import { TurnosComponent } from './pages/admin/turnos/turnos.component';
import { AgendarComponent } from './pages/public/agendar/agendar.component';
import { authGuard } from './core/guards/auth.guard';
import { BarberosComponent } from './pages/admin/barberos/barberos.component';
import { GastosComponent } from './pages/admin/gastos/gastos.component';
import { DashboardComponent as ClienteDashboardComponent } from './pages/cliente/dashboard/dashboard.component';
import { PerfilComponent } from './pages/cliente/perfil/perfil.component';
import { AgendaComponent } from './pages/barbero/agenda/agenda.component';
import { StatsComponent } from './pages/barbero/stats/stats.component';
import { HorarioComponent } from './pages/barbero/horario/horario.component';
import { BarberoLayoutComponent } from './layouts/barbero-layout/barbero-layout.component';
import { CreditosComponent } from './pages/admin/creditos/creditos.component';
import { CierreCajaComponent } from './pages/admin/cierre-caja/cierre-caja.component';
import { ClienteLayoutComponent } from './layouts/cliente-layout/cliente-layout.component';
import { HistoriaComponent } from './pages/public/nosotros/historia/historia.component';
import { RecuperarPasswordComponent } from './pages/public/recuperar-password/recuperar-password.component';
import { CheckoutComponent } from './pages/public/checkout/checkout.component';
import { PagoResultadoComponent } from './pages/public/pago-resultado/pago-resultado.component';
const routes: Routes = [
  { path: 'nosotros/historia', redirectTo: 'nosotros', pathMatch: 'full' },
  { path: 'nosotros/mision', redirectTo: 'nosotros', pathMatch: 'full' },
  { path: 'nosotros/valores', redirectTo: 'nosotros', pathMatch: 'full' },
  { path: 'nosotros/trabaja', redirectTo: 'nosotros', pathMatch: 'full' },

  // Rutas públicas
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'nosotros', component: HistoriaComponent },
      { path: 'agendar', component: AgendarComponent },
      { path: 'login', component: LoginComponent },
      { path: 'registro', component: RegistroComponent },
      { path: 'recuperar-password', component: RecuperarPasswordComponent },
      { path: 'carrito', redirectTo: '', pathMatch: 'full' },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'pago/resultado', component: PagoResultadoComponent },
    ]
  },

  // Admin
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { rol: 'admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'reservas',  component: ReservasComponent  },
      { path: 'clientes',  component: ClientesComponent  },
      { path: 'servicios', component: ServiciosComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'ventas',    component: VentasComponent    },
      { path: 'turnos',    component: TurnosComponent    },
      { path: 'reportes',  redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'barberos',  component: BarberosComponent  },
      { path: 'gastos',    component: GastosComponent    },
      { path: 'creditos',    component: CreditosComponent   },
      { path: 'cierre-caja', component: CierreCajaComponent }
    ]
  },

  // Barbero
  {
    path: 'barbero',
    component: BarberoLayoutComponent,
    canActivate: [authGuard],
    data: { rol: 'barbero' },
    children: [
      { path: '', redirectTo: 'agenda', pathMatch: 'full' },
      { path: 'agenda',  component: AgendaComponent  },
      { path: 'stats',   component: StatsComponent   },
      { path: 'horario', component: HorarioComponent },
    ]
  },

  // Cliente
  {
    path: 'cliente',
    component: ClienteLayoutComponent,
    canActivate: [authGuard],
    data: { rol: 'cliente' },
    children: [
      { path: '', redirectTo: 'mis-citas', pathMatch: 'full' },
      { path: 'mis-citas', component: ClienteDashboardComponent },
      { path: 'perfil',    component: PerfilComponent },
    ]
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
