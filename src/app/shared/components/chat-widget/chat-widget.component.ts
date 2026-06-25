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
    { label: '¿Cómo hago una reserva?', value: '¿Cómo hago una reserva?' },
    { label: 'Ver servicios', value: 'Ver servicios' },
    { label: 'Ver productos', value: 'Ver productos' },
    { label: 'Ver barberos', value: 'Ver barberos' },
    { label: 'Recuperar contraseña', value: 'Recuperar contraseña' },
    { label: 'Volver al menú principal', value: 'Volver al inicio' },
  ];

  readonly sugerenciasCliente: IChatOption[] = [
    { label: 'Agendar cita', value: 'Agendar cita' },
    { label: '¿Cómo hago una reserva?', value: '¿Cómo hago una reserva?' },
    { label: 'Ver servicios', value: 'Ver servicios' },
    { label: 'Ver productos', value: 'Ver productos' },
    { label: 'Ver barberos', value: 'Ver barberos' },
    { label: 'Recuperar contraseña', value: 'Recuperar contraseña' },
    { label: 'Volver al menú principal', value: 'Volver al inicio' },
  ];

  sugerencias: IChatOption[] = [];
  reservaActiva = false;
  passInput = '';

  abierto = false;
  enviando = false;
  error = '';
  input = '';
  scrolled = false;
  usuario: IUsuario | null = null;
  mensajes: IChatMessage[] = [];
  permitirMensajeFlotante = true;

  private readonly PENDING_ACTION_KEY = 'blendlap_chat_pending_action';
  private prevUserId: number | null = null;
  private pendingRestoring = false;

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
      const currentUserId = u?.id_usuario ?? null;
      const justLoggedIn = !this.prevUserId && currentUserId !== null && u?.rol === 'cliente';
      this.usuario = u;

      if (justLoggedIn) {
        const pendingAction = sessionStorage.getItem(this.PENDING_ACTION_KEY);
        if (pendingAction) {
          sessionStorage.removeItem(this.PENDING_ACTION_KEY);
          this.mensajes = [{ role: 'bot', text: this.mensajeBienvenida(), at: new Date() }];
          this.actualizarSugerencias();
          this.pendingRestoring = true;
          this.abierto = true;
          this.permitirMensajeFlotante = false;
          if (pendingAction !== '__welcome__') {
            setTimeout(() => {
              this.input = pendingAction;
              this.enviar();
            }, 500);
          }
          this.prevUserId = currentUserId;
          return;
        }
      }

      this.prevUserId = currentUserId;
      this.cargarEstadoDeStorage();
    });

    const routeSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.pendingRestoring) {
          this.pendingRestoring = false;
          this.actualizarSugerencias();
          return;
        }
        if (this.abierto) {
          this.abierto = false;
          this.permitirMensajeFlotante = true;
        }
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
    const url = this.router?.url?.split('?')[0] || '';
    if (url === '/login' || url === '/registro') return false;
    return !this.usuario || this.usuario.rol === 'cliente';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 80;
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
        return v !== 'agendar cita';
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
      if (el) el.scrollTop = el.scrollHeight;
    }, delayMs);
  }

  private scrollAlUltimoMensaje(delayMs = 80): void {
    setTimeout(() => {
      const el = this.mensajesContainer?.nativeElement as HTMLElement;
      if (!el) return;
      const msgs = el.querySelectorAll<HTMLElement>('.chat-widget__msg--bot:not(.chat-widget__msg--typing)');
      const last = msgs[msgs.length - 1];
      if (last) {
        el.scrollTop = last.offsetTop - el.offsetTop;
      } else {
        el.scrollTop = el.scrollHeight;
      }
    }, delayMs);
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
    this.guardarAccionPendiente();
    this.cerrar();
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/' } });
  }

  irARegistro(): void {
    this.guardarAccionPendiente();
    this.cerrar();
    this.router.navigate(['/registro'], { queryParams: { returnUrl: '/' } });
  }

  private guardarAccionPendiente(): void {
    const lastUserMsg = [...this.mensajes].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      sessionStorage.setItem(this.PENDING_ACTION_KEY, lastUserMsg.text);
    }
  }

  enviar(): void {
    const texto = this.input.trim();
    if (!texto || this.enviando) return;
    this.input = '';
    this.despacharMensaje(texto, texto);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }

  usarSugerencia(label: string, value: string): void {
    if (this.enviando) return;
    const v = value.trim().toLowerCase();
    if (v === 'iniciar sesion' || v === 'iniciar sesión') {
      sessionStorage.setItem(this.PENDING_ACTION_KEY, '__welcome__');
      this.cerrar();
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/' } });
      return;
    }
    this.despacharMensaje(label, value);
  }

  private despacharMensaje(textoVisible: string, valorBackend: string): void {
    this.error = '';
    this.mensajes.push({ role: 'user', text: textoVisible, at: new Date() });
    this.guardarEstadoEnStorage();
    this.scrollAlFinal();
    this.enviando = true;
    this.scrollAlFinal();

    this.chatService.sendMessage(valorBackend, this.esInvitado).subscribe({
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

          const isFreshStart = Boolean(res.data.meta?.freshStart);

          if (isFreshStart) {
            this.mensajes = [botMsg];
          } else {
            this.mensajes.push(botMsg);
          }

          const step = res.data.meta?.['step'];
          const intent = res.data.intent;
          if (step) {
            this.reservaActiva = true;
          } else if (isFreshStart || intent !== 'create_reservation') {
            this.reservaActiva = false;
          }

          if (isFreshStart) {
            // Siempre usar el menú actualizado del componente en un reset
            this.actualizarSugerencias();
          } else {
            let opciones = res.data.meta?.options;
            if (!opciones || opciones.length === 0) {
              opciones = this.reservaActiva
                ? [{ label: 'Cancelar', value: 'Cancelar' }]
                : (this.esCliente ? this.sugerenciasCliente : this.sugerenciasInvitado);
            }
            this.sugerencias = this.filtrarSugerencias(opciones);
          }
          this.guardarEstadoEnStorage();

        } else {
          this.error = res.mensaje || 'No pude obtener una respuesta.';
        }
        this.scrollAlUltimoMensaje();
      },
      error: (err) => {
        this.enviando = false;
        this.error = err.error?.mensaje || 'Error al conectar con BARBUX. Verifica que el backend esté activo.';
        this.scrollAlFinal();
      }
    });
  }

  tieneTarjetas(m: IChatMessage): boolean {
    return Boolean(m.catalogCards?.length || m.products?.length);
  }

  private parseCatalogCards(meta?: { catalogCards?: IChatCatalogCard[]; products?: IChatProductCard[] }): IChatCatalogCard[] {
    const cards = meta?.catalogCards;
    if (Array.isArray(cards) && cards.length) {
      return cards
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
    const [y, m, d] = val.split('-');
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const etiqueta = `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
    this.despacharMensaje(etiqueta, val);
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
    this.despacharMensaje(this.formatHoraLegible(slot), slot);
  }

  seleccionarCard(c: IChatCatalogCard): void {
    if (this.enviando) return;
    if (c.mediaFolder === 'servicios') {
      const valor = this.reservaActiva ? c.nombre : `Agendar ${c.nombre}`;
      this.despacharMensaje(valor, valor);
    } else if (c.mediaFolder === 'barberos') {
      const valor = this.reservaActiva ? c.nombre : `Agendar con ${c.nombre}`;
      this.despacharMensaje(valor, valor);
    }
  }

  enviarPassword(): void {
    const pass = this.passInput.trim();
    if (!pass || this.enviando) return;
    this.passInput = '';
    this.despacharMensaje('••••••••', pass);
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
        savedAt: Date.now()
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
        const expirado = !state.savedAt || (Date.now() - state.savedAt) > 60_000;
        if (!expirado && Array.isArray(state.mensajes) && state.mensajes.length > 0) {
          this.mensajes = state.mensajes.map((m: any) => ({
            ...m,
            at: new Date(m.at)
          }));
          this.reservaActiva = Boolean(state.reservaActiva);
          this.actualizarSugerencias();
          this.scrollAlFinal(50);
          return;
        }
        localStorage.removeItem(key);
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
