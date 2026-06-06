import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS, MatDateFormats } from '@angular/material/core';
import { MatDateInputComponent } from './shared/components/mat-date-input/mat-date-input.component';
import { TimeSelectComponent } from './shared/components/time-select/time-select.component';

const DATE_FORMATS: MatDateFormats = {
  parse:   { dateInput: null as any },
  display: {
    dateInput:          { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel:     { month: 'long', year: 'numeric' },
    dateA11yLabel:      { day: 'numeric', month: 'long', year: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
  },
};

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { RouteReuseStrategy } from '@angular/router';
import { CustomReuseStrategy } from './core/strategies/reuse.strategy';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { BarberoLayoutComponent } from './layouts/barbero-layout/barbero-layout.component';
import { ClienteLayoutComponent } from './layouts/cliente-layout/cliente-layout.component';

import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

import { HomeComponent } from './pages/public/home/home.component';
import { LoginComponent } from './pages/public/login/login.component';
import { RegistroComponent } from './pages/public/registro/registro.component';
import { AgendarComponent } from './pages/public/agendar/agendar.component';
import { CarritoComponent } from './pages/public/carrito/carrito.component';
import { RecuperarPasswordComponent } from './pages/public/recuperar-password/recuperar-password.component';
import { CheckoutComponent } from './pages/public/checkout/checkout.component';
import { PagoResultadoComponent } from './pages/public/pago-resultado/pago-resultado.component';

import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ReservasComponent } from './pages/admin/reservas/reservas.component';
import { ClientesComponent } from './pages/admin/clientes/clientes.component';
import { ServiciosComponent } from './pages/admin/servicios/servicios.component';
import { ProductosComponent } from './pages/admin/productos/productos.component';
import { VentasComponent } from './pages/admin/ventas/ventas.component';
import { TurnosComponent } from './pages/admin/turnos/turnos.component';
import { ReportesComponent } from './pages/admin/reportes/reportes.component';
import { BarberosComponent } from './pages/admin/barberos/barberos.component';
import { GastosComponent } from './pages/admin/gastos/gastos.component';
import { CreditosComponent } from './pages/admin/creditos/creditos.component';
import { CierreCajaComponent } from './pages/admin/cierre-caja/cierre-caja.component';

import { AgendaComponent } from './pages/barbero/agenda/agenda.component';
import { StatsComponent } from './pages/barbero/stats/stats.component';
import { HorarioComponent } from './pages/barbero/horario/horario.component';

import { DashboardComponent as ClienteDashboardComponent } from './pages/cliente/dashboard/dashboard.component';
import { PerfilComponent } from './pages/cliente/perfil/perfil.component';
import { HistoriaComponent } from './pages/public/nosotros/historia/historia.component';
import { MisionComponent } from './pages/public/nosotros/mision/mision.component';
import { TrabajaComponent } from './pages/public/nosotros/trabaja/trabaja.component';
import { ValoresComponent } from './pages/public/nosotros/valores/valores.component';
import { ImgUrlPipe } from './shared/pipes/img-url.pipe';
import { ToastComponent } from './shared/components/toast/toast.component';
@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    ImgUrlPipe,
    FooterComponent,
    PublicLayoutComponent,
    AdminLayoutComponent,
    BarberoLayoutComponent,
    ClienteLayoutComponent,
    HomeComponent,
    LoginComponent,
    RegistroComponent,
    AgendarComponent,
    CarritoComponent,
    RecuperarPasswordComponent,
    CheckoutComponent,
    PagoResultadoComponent,
    DashboardComponent,
    ReservasComponent,
    ClientesComponent,
    ServiciosComponent,
    ProductosComponent,
    VentasComponent,
    TurnosComponent,
    ReportesComponent,
    BarberosComponent,
    GastosComponent,
    CreditosComponent,
    CierreCajaComponent,
    AgendaComponent,
    StatsComponent,
    HorarioComponent,
    ClienteDashboardComponent,
    PerfilComponent,
    ToastComponent,
    HistoriaComponent,
    MisionComponent,
    TrabajaComponent,
    ValoresComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    AppRoutingModule,
    NgApexchartsModule,
    BrowserAnimationsModule,
    MatNativeDateModule,
    MatDateInputComponent,
    TimeSelectComponent,
  ],
  providers: [
    DatePipe,
    CurrencyPipe,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}