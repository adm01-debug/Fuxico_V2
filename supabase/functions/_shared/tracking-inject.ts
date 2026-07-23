/**
 * Injeção de tracking em HTML de e-mail.
 *
 * Contrato de URLs públicas (proxied via `public/_redirects` para os Edge
 * Functions `track-pixel` / `track-link`):
 *   - Pixel  : /api/public/track/open.gif?tp=<trackingId>
 *   - Click  : /api/public/track/click?tp=<trackingId>&l=<linkId>
 *
 * O parâmetro `tp` (tracking pixel/parcel) é intencionalmente curto para
 * evitar heurísticas de spam que sinalizam querystrings verbosas.
 */

const PIXEL_PATH = "/api/public/track/open.gif";
const CLICK_PATH = "/api/public/track/click";

const ANCHOR_HREF_RE = /(<a\b[^>]*?\shref\s*=\s*)(["'])(.*?)\2/gi;

export interface TrackingLinkMap {
  /** Mapeia URL original -> linkId persistido em `tracked_links.link_id`. */
  [originalUrl: string]: string;
}

export interface InjectTrackingOptions {
  trackingId: string;
  /** Origem pública (ex: https://open-receipt-ace.lovable.app). Sem barra final. */
  baseUrl: string;
  /** Mapeamento pré-persistido de links originais para linkId. */
  linkMap?: TrackingLinkMap;
  /** Se true (default) injeta o pixel de open no final do body/html. */
  injectPixel?: boolean;
  /** Se true (default) reescreve links `<a href>` para o proxy de click. */
  rewriteLinks?: boolean;
}

/**
 * Determina se uma URL deve ser reescrita para tracking.
 * Ignora âncoras, mailto, tel, javascript e links já apontando para o proxy.
 */
export function shouldRewriteHref(href: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#")) return false;
  if (/^(mailto:|tel:|sms:|javascript:|data:)/i.test(trimmed)) return false;
  if (trimmed.includes(PIXEL_PATH) || trimmed.includes(CLICK_PATH)) return false;
  // apenas URLs absolutas http/https são reescritas — links relativos não fazem
  // sentido em e-mails.
  return /^https?:\/\//i.test(trimmed);
}

export function buildPixelUrl(baseUrl: string, trackingId: string): string {
  return `${stripTrailingSlash(baseUrl)}${PIXEL_PATH}?tp=${encodeURIComponent(trackingId)}`;
}

export function buildClickUrl(baseUrl: string, trackingId: string, linkId: string): string {
  return `${stripTrailingSlash(baseUrl)}${CLICK_PATH}?tp=${encodeURIComponent(trackingId)}&l=${encodeURIComponent(linkId)}`;
}

export function buildPixelHtml(baseUrl: string, trackingId: string): string {
  const url = buildPixelUrl(baseUrl, trackingId);
  return `<img src="${url}" alt="" width="1" height="1" style="display:none!important;border:0;width:1px;height:1px;overflow:hidden;" />`;
}

/**
 * Aplica reescrita de `<a href>` e injeção de pixel em um corpo HTML.
 * Puro: não faz I/O. O caller é responsável por persistir `linkMap`.
 */
export function injectTracking(html: string, opts: InjectTrackingOptions): string {
  const {
    trackingId,
    baseUrl,
    linkMap = {},
    injectPixel = true,
    rewriteLinks = true,
  } = opts;

  if (!trackingId) return html;

  let result = html ?? "";

  if (rewriteLinks && Object.keys(linkMap).length > 0) {
    result = result.replace(ANCHOR_HREF_RE, (match, prefix, quote, url) => {
      if (!shouldRewriteHref(url)) return match;
      const linkId = linkMap[url];
      if (!linkId) return match;
      const wrapped = buildClickUrl(baseUrl, trackingId, linkId);
      return `${prefix}${quote}${wrapped}${quote}`;
    });
  }

  if (injectPixel) {
    const pixel = buildPixelHtml(baseUrl, trackingId);
    // Insere antes de </body> se existir, senão no final.
    if (/<\/body\s*>/i.test(result)) {
      result = result.replace(/<\/body\s*>/i, `${pixel}</body>`);
    } else {
      result = `${result}${pixel}`;
    }
  }

  return result;
}

/**
 * Extrai URLs absolutas de `<a href>` em um HTML, deduplicadas.
 * Útil para pré-registrar `tracked_links` antes da injeção.
 */
export function extractTrackableLinks(html: string): string[] {
  if (!html) return [];
  const found = new Set<string>();
  for (const match of html.matchAll(ANCHOR_HREF_RE)) {
    const url = match[3];
    if (shouldRewriteHref(url)) found.add(url);
  }
  return [...found];
}

function stripTrailingSlash(u: string): string {
  return u.endsWith("/") ? u.slice(0, -1) : u;
}
