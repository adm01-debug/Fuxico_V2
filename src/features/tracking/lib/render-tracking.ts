/**
 * Espelho frontend de `supabase/functions/_shared/tracking-inject.ts`.
 *
 * Utilizado pelo dashboard para renderizar previews e preparar o corpo do
 * e-mail antes do envio pelo cliente de e-mail externo (Gmail/Outlook), com
 * pixel e links reescritos no padrão `/api/public/track/*`.
 */

const PIXEL_PATH = "/api/public/track/open.gif";
const CLICK_PATH = "/api/public/track/click";

const ANCHOR_HREF_RE = /(<a\b[^>]*?\shref\s*=\s*)(["'])(.*?)\2/gi;

export interface TrackingLinkMap {
  [originalUrl: string]: string;
}

export interface InjectTrackingOptions {
  trackingId: string;
  baseUrl: string;
  linkMap?: TrackingLinkMap;
  injectPixel?: boolean;
  rewriteLinks?: boolean;
}

export function shouldRewriteHref(href: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#")) return false;
  if (/^(mailto:|tel:|sms:|javascript:|data:)/i.test(trimmed)) return false;
  if (trimmed.includes(PIXEL_PATH) || trimmed.includes(CLICK_PATH)) return false;
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
    if (/<\/body\s*>/i.test(result)) {
      result = result.replace(/<\/body\s*>/i, `${pixel}</body>`);
    } else {
      result = `${result}${pixel}`;
    }
  }

  return result;
}

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
