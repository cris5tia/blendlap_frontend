import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type ChatIntent = 'info' | 'create_reservation' | 'list_reservations';
export type ChatMediaFolder = 'productos' | 'barberos' | 'servicios';

export interface IChatOption {
  label: string;
  value: string;
}

export interface IChatProductCard {
  nombre: string;
  precio: string;
  imagen: string | null;
  disponible: boolean;
}

export interface IChatCatalogCard {
  nombre: string;
  subtitulo?: string;
  imagen: string | null;
  mediaFolder: ChatMediaFolder;
  badge?: string;
}

export interface IChatMessage {
  role: 'user' | 'bot';
  text: string;
  at: Date;
  products?: IChatProductCard[];
  catalogCards?: IChatCatalogCard[];
  requiresAuth?: boolean;
  step?: string;
  slots?: string[];
}

export interface IChatResponse {
  ok: boolean;
  data?: {
    reply: string;
    intent: ChatIntent;
    meta?: {
      options?: IChatOption[];
      products?: IChatProductCard[];
      catalogCards?: IChatCatalogCard[];
      requiresAuth?: boolean;
      freshStart?: boolean;
      [key: string]: unknown;
    };
  };
  mensaje?: string;
}

const GUEST_SESSION_KEY = 'blendlap_chat_guest_session';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private url = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  getGuestSessionId(): string {
    let id = localStorage.getItem(GUEST_SESSION_KEY);
    if (!id || id.length < 8) {
      id = `g_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(GUEST_SESSION_KEY, id);
    }
    return id;
  }

  sendMessage(message: string, asGuest = false): Observable<IChatResponse> {
    if (asGuest) {
      return this.http
        .post<IChatResponse>(this.url + '/public', {
          message,
          sessionId: this.getGuestSessionId(),
        })
        .pipe(timeout(35000));
    }

    return this.http
      .post<IChatResponse>(this.url, { message })
      .pipe(timeout(35000));
  }
}
