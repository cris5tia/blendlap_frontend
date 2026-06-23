import { environment } from '../../../environments/environment';

const API_BASE = environment.apiUrl.replace(/\/api\/?$/, '');
const FALLBACK = 'assets/images/no-img.png';

export function resolveMediaUrl(value?: string | null, folder?: string): string {
  const raw = (value ?? '').trim();
  if (!raw) return FALLBACK;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('data:')) return raw;
  if (raw.startsWith('assets/') || raw.startsWith('/assets/')) {
    return raw.startsWith('/') ? raw.slice(1) : raw;
  }

  const normalizedFolder = (folder ?? '').replace(/^\/+|\/+$/g, '');
  const basePath = normalizedFolder ? `/images/${normalizedFolder}/` : '/images/';
  const filename = raw.replace(/^\/+/, '');
  return `${API_BASE}${basePath}${filename}`;
}
