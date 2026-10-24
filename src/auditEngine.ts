// Інтерфейс системних логів аудиту
export interface AuditLog {
  source: 'HTML Proxy' | 'Google PageSpeed' | 'Analytics Scanner';
  status: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

// Витяг чистих параметрів домену та назви бренду
export function extractDomainInfo(rawUrl: string): { host: string; brand: string } {
  try {
    let clean = rawUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const u = new URL(clean);
    const host = u.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    const rawBrand = parts.length > 1 ? parts[0] : host;
    const brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
    return { host, brand };
  } catch {
    return { host: rawUrl, brand: rawUrl || "Магазин" };
  }
}

// Отримання сирого HTML через каскад проксі без штучних даних
export async function fetchStoreHtml(targetUrl: string): Promise<{ html: string; usedProxy: string }> {
  const isVercel = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  
  const sources = [
    ...(isVercel ? [{ name: 'Vercel Edge Proxy', url: `/api/fetch-html?url=${encodeURIComponent(targetUrl)}` }] : []),
    { name: 'allorigins.win', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` },
    { name: 'corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` }
  ];

  const errors: string[] = [];

  for (const src of sources) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(src.url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 250 && !text.includes('Challenge Validation') && !text.includes('Just a moment...')) {
          return { html: text, usedProxy: src.name };
        }
      }
      errors.push(`${src.name}: HTTP ${res.status}`);
    } catch (e: any) {
      errors.push(`${src.name}: ${e?.message || 'таймаут/відмова'}`);
    }
  }

  throw new Error(`Не вдалося завантажити HTML сайту (${errors.join('; ')}). Перевірте доступність сайту.`);
}

// Реекспорт винесених модулів аналітики та швидкості
export { parseStoreHtml, discoverShopifySubpages } from './engine/seoParser';
export { runGooglePageSpeed } from './engine/pageSpeed';
