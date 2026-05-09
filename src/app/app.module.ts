import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

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
import { ClienteModule } from './pages/cliente/cliente.module';
import { AgendaComponent } from './pages/barbero/agenda/agenda.component';


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    PublicLayoutComponent,
    AdminLayoutComponent,
    BarberoLayoutComponent,
    ClienteLayoutComponent,
    HomeComponent,
    LoginComponent,
    RegistroComponent,
    AgendarComponent,
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
    AgendaComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ClienteModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }