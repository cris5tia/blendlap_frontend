import { Component, ElementRef, OnDestroy, OnInit, ViewChild, HostListener } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService, IUsuario } from '../../../core/services/auth.service';
import {
  ChatService,
  IChatCatalogCard,
  IChatMessage,
  IChatOption,
  IChatProductCard,
} from '../../../core/services/chat.service';

@Component({
  selector: 'app-chat-widget',
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss']
})
export class ChatWidgetComponent implements OnInit, OnDestroy {

  readonly mascotUrl = 'assets/images/navbar/barbux.png';
  readonly headerAvatarUrl = 'assets/images/navbar/barbux.png';

  readonly sugerenciasInvitado: IChatOption[] = [
    { label: 'Ver servicios', value: 'Ver servicios' },
    { label: 'Ver productos', value: 'Ver productos' },
    { label: 'Ver barberos disponibles', value: 'Ver barberos disponibles' },
    { label: '¿Cómo hago una reserva?', value: '¿Cómo hago una reserva?' },
    { label: 'Volver al inicio', value: 'Volver al inicio' },
  ];

  readonly sugerenciasCliente: IChatOption[] = [
    { label: 'Agendar cita', value: 'Agendar cita' },
    { label: 'Mis citas', value: 'Mis citas' },
    { label: 'Ver servicios', value: 'Ver servicios' },
    { label: 'Ver productos', value: 'Ver productos' },
    { label: 'Ver barberos disponibles', value: 'Ver barberos disponibles' },
    { label: '¿Cómo hago una reserva?', value: '¿Cómo hago una reserva?' },
    { label: 'Volver al inicio', value: 'Volver al inicio' },
  ];

  sugerencias: IChatOption[] = [];
  reservaActiva = false;

  abierto = false;
  enviando = false;
  error = '';
  input = '';
  usuario: IUsuario | null = null;
  mensajes: IChatMessage[] = [];
  permitirMensajeFlotante = true;

  @ViewChild('mensajesContainer') mensajesContainer?: ElementRef<HTMLDivElement>;

  private sub?: Subscription;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.sub = new Subscription();

    const userSub = this.authService.usuario$.subscribe(u => {
      this.usuario = u;
      this.cargarEstadoDeStorage();
    });

    const routeSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.actualizarSugerencias();
      });

    this.sub.add(userSub);
    this.sub.add(routeSub);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get esCliente(): boolean {
    return this.usuario?.rol === 'cliente';
  }

  get esInvitado(): boolean {
    return !this.esCliente;
  }

  get mostrarChatbot(): boolean {
    return !this.usuario || this.usuario.rol === 'cliente';
  }

  private actualizarSugerencias(): void {
    const rawOptions = [...(this.esCliente ? this.sugerenciasCliente : this.sugerenciasInvitado)];
    this.sugerencias = this.filtrarSugerencias(rawOptions);
  }

  private filtrarSugerencias(options: IChatOption[]): IChatOption[] {
    if (!options) return [];
    let filtered = options;

    if (this.esInvitado) {
      filtered = filtered.filter((s) => {
        const v = s.value?.trim().toLowerCase() || '';
        return v !== 'agendar cita' && v !== 'mis citas';
      });
    }

    const isHome = this.router?.url?.split('?')[0] === '/';
    const hasInteracted = this.mensajes?.some((m) => m.role === 'user') || false;

    if (isHome && !hasInteracted) {
      filtered = filtered.filter((s) => {
        const val = s.value?.trim().toLowerCase() || '';
        const lbl = s.label?.trim().toLowerCase() || '';
        return val !== 'volver al inicio' && lbl !== 'volver al inicio';
      });
    }

    return filtered;
  }

  private mensajeBienvenida(): string {
    if (this.esCliente) {
      return [
        '¡Hola! Soy BARBUX, tu asistente de Blendlap.',
        '',
        'Puedo ayudarte a agendar citas, ver tus reservas, consultar servicios y productos.',
        '',
        'Usa los botones de abajo o escríbeme lo que necesites.',
      ].join('\n');
    }
    return [
      '¡Hola! Soy BARBUX, tu asistente de Blendlap.',
      '',
      'Puedo ayudarte con servicios, productos y barberos.',
      '',
      '¿En qué te ayudo?',
    ].join('\n');
  }

  private scrollAlFinal(delayMs = 0): void {
    setTimeout(() => {
      const el = this.mensajesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, delayMs);
  }

  private crearMensajeBot(res: NonNullable<IChatMessage['text']> extends string ? any : never, meta?: {
    reply: string;
    meta?: {
      products?: IChatProductCard[];
      catalogCards?: IChatCatalogCard[];
      requiresAuth?: boolean;
    };
  }): IChatMessage {
    const catalogCards = this.parseCatalogCards(meta?.meta);
    return {
      role: 'bot',
      text: meta?.reply || '',
      at: new Date(),
      products: catalogCards.length ? undefined : this.parseProducts(meta?.meta?.products),
      catalogCards: catalogCards.length ? catalogCards : undefined,
      requiresAuth: Boolean(meta?.meta?.requiresAuth),
    };
  }

  toggle(): void {
    this.abierto = !this.abierto;
    if (!this.abierto) {
      this.permitirMensajeFlotante = false;
    }
    if (this.abierto && this.mensajes.length === 0) {
      this.mensajes.push({
        role: 'bot',
        text: this.mensajeBienvenida(),
        at: new Date()
      });
      this.actualizarSugerencias();
      this.scrollAlFinal();
    }
  }

  cerrar(): void {
    this.abierto = false;
    this.permitirMensajeFlotante = false;
  }

  onMouseLeaveWrap(): void {
    this.permitirMensajeFlotante = true;
  }

  irALogin(): void {
    this.cerrar();
    this.router.navigate(['/login']);
  }

  irARegistro(): void {
    this.cerrar();
    this.router.navigate(['/registro']);
  }

  enviar(): void {
    const texto = this.input.trim();
    if (!texto || this.enviando) return;

    this.input = '';
    this.error = '';
    this.mensajes.push({ role: 'user', text: texto, at: new Date() });
    this.guardarEstadoEnStorage();
    this.scrollAlFinal();
    this.enviando = true;
    this.scrollAlFinal();

    this.chatService.sendMessage(texto, this.esInvitado).subscribe({
      next: (res) => {
        this.enviando = false;
        if (res.ok && res.data?.reply) {
          const botMsg: IChatMessage = {
            role: 'bot',
            text: res.data.reply,
            at: new Date(),
            requiresAuth: Boolean(res.data.meta?.requiresAuth),
            step: res.data.meta?.['step'] as string,
            slots: res.data.meta?.['slots'] as string[],
          };
          const catalogCards = this.parseCatalogCards(res.data.meta);
          if (catalogCards.length) {
            botMsg.catalogCards = catalogCards;
          } else {
            const products = this.parseProducts(res.data.meta?.products);
            if (products.length) botMsg.products = products;
          }

          if (res.data.meta?.freshStart) {
            this.mensajes = [botMsg];
          } else {
            this.mensajes.push(botMsg);
          }
          const step = res.data.meta?.['step'];
          const intent = res.data.intent;

          if (step) {
            this.reservaActiva = true;
          } else if (res.data.meta?.freshStart || intent !== 'create_reservation') {
            this.reservaActiva = false;
          }

          let opciones = res.data.meta?.options;
          if (!opciones || opciones.length === 0) {
            if (this.reservaActiva) {
              opciones = [{ label: 'Cancelar', value: 'cancelar' }];
            } else {
              opciones = this.esCliente ? this.sugerenciasCliente : this.sugerenciasInvitado;
            }
          }
          this.sugerencias = this.filtrarSugerencias(opciones);
          this.guardarEstadoEnStorage();

          if (catalogCards.length || botMsg.products?.length) {
            this.scrollAlFinal(150);
          }
        } else {
          this.error = res.mensaje || 'No pude obtener una respuesta.';
        }
        this.scrollAlFinal();
      },
      error: (err) => {
        this.enviando = false;
        this.error = err.error?.mensaje || 'Error al conectar con BARBUX. Verifica que el backend esté activo.';
        this.scrollAlFinal();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }

  usarSugerencia(texto: string): void {
    if (this.enviando) return;
    if (texto.trim().toLowerCase() === 'volver al inicio') {
      this.router.navigate(['/']);
    }
    this.input = texto;
    this.enviar();
  }

  tieneTarjetas(m: IChatMessage): boolean {
    return Boolean(m.catalogCards?.length || m.products?.length);
  }

  private parseCatalogCards(meta?: { catalogCards?: IChatCatalogCard[]; products?: IChatProductCard[] }): IChatCatalogCard[] {
    if (Array.isArray(meta?.catalogCards) && meta.catalogCards.length) {
      return meta.catalogCards
        .filter((c): c is IChatCatalogCard => !!c && typeof c === 'object' && 'nombre' in c)
        .map((c) => ({
          nombre: String(c.nombre || ''),
          subtitulo: c.subtitulo ? String(c.subtitulo) : undefined,
          imagen: c.imagen ?? null,
          mediaFolder: c.mediaFolder === 'barberos' || c.mediaFolder === 'servicios' ? c.mediaFolder : 'productos',
          badge: c.badge ? String(c.badge) : undefined,
        }));
    }

    const products = this.parseProducts(meta?.products);
    return products.map((p) => ({
      nombre: p.nombre,
      subtitulo: p.precio,
      imagen: p.imagen,
      mediaFolder: 'productos' as const,
      badge: p.disponible ? 'Disponible' : 'Agotado',
    }));
  }

  private parseProducts(raw: unknown): IChatProductCard[] {
    const list = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object' && Array.isArray((raw as { products?: unknown }).products)
        ? (raw as { products: IChatProductCard[] }).products
        : undefined;
    if (!list) return [];
    return list
      .filter((p): p is IChatProductCard => !!p && typeof p === 'object' && 'nombre' in p)
      .map((p) => ({
        nombre: String(p.nombre || 'Producto'),
        precio: String(p.precio || ''),
        imagen: p.imagen ?? null,
        disponible: Boolean(p.disponible),
      }));
  }

  isLastMessage(m: IChatMessage): boolean {
    return this.mensajes[this.mensajes.length - 1] === m;
  }

  get minDate(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onDateSelected(event: any): void {
    const val = event.target.value;
    if (!val || this.enviando) return;
    this.input = val;
    this.enviar();
  }

  formatHoraLegible(hora: string): string {
    if (!hora) return '';
    const parts = hora.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return hora;
    const sufijo = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${sufijo}`;
  }

  seleccionarSlot(slot: string): void {
    if (this.enviando) return;
    this.input = slot;
    this.enviar();
  }

  seleccionarCard(c: IChatCatalogCard): void {
    if (this.enviando) return;
    if (c.mediaFolder === 'servicios') {
      if (this.reservaActiva) {
        this.input = c.nombre;
      } else {
        this.input = `Agendar ${c.nombre}`;
      }
      this.enviar();
    } else if (c.mediaFolder === 'barberos') {
      if (this.reservaActiva) {
        this.input = c.nombre;
      } else {
        this.input = `Agendar con ${c.nombre}`;
      }
      this.enviar();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.abierto) return;

    const element = this.elementRef.nativeElement;
    const target = event.target as Node;
    const clickedInside = element.contains(target) || !document.body.contains(target);

    if (!clickedInside) {
      this.abierto = false;
      this.permitirMensajeFlotante = false;
    }
  }

  private getStorageKey(): string {
    const userId = this.usuario?.id_usuario || 'guest';
    return `blendlap_chat_history_${userId}`;
  }

  private guardarEstadoEnStorage(): void {
    try {
      const state = {
        mensajes: this.mensajes,
        reservaActiva: this.reservaActiva,
        sugerencias: this.sugerencias
      };
      localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
    } catch (e) {
      console.error('Error saving chat state to localStorage', e);
    }
  }

  private cargarEstadoDeStorage(): void {
    try {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const state = JSON.parse(stored);
        if (state && Array.isArray(state.mensajes) && state.mensajes.length > 0) {
          this.mensajes = state.mensajes.map((m: any) => ({
            ...m,
            at: new Date(m.at)
          }));
          this.reservaActiva = Boolean(state.reservaActiva);
          if (Array.isArray(state.sugerencias)) {
            this.sugerencias = state.sugerencias;
          } else {
            this.actualizarSugerencias();
          }
          this.scrollAlFinal(50);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading chat state from localStorage', e);
    }

    this.mensajes = [{
      role: 'bot',
      text: this.mensajeBienvenida(),
      at: new Date()
    }];
    this.reservaActiva = false;
    this.actualizarSugerencias();
    this.scrollAlFinal(50);
  }
}
