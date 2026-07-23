import { describe, it, expect } from "vitest";
import {
  buildClickUrl,
  buildPixelHtml,
  buildPixelUrl,
  extractTrackableLinks,
  injectTracking,
  shouldRewriteHref,
} from "../render-tracking";

const BASE = "https://open-receipt-ace.lovable.app";
const TID = "a1b2c3d4";

describe("render-tracking helpers", () => {
  it("gera pixel apontando para /api/public/track/open.gif com tp=", () => {
    expect(buildPixelUrl(BASE, TID)).toBe(
      `${BASE}/api/public/track/open.gif?tp=${TID}`,
    );
    expect(buildPixelHtml(BASE, TID)).toContain("width=\"1\"");
  });

  it("gera click no formato /api/public/track/click?tp=&l=", () => {
    expect(buildClickUrl(BASE, TID, "L1")).toBe(
      `${BASE}/api/public/track/click?tp=${TID}&l=L1`,
    );
  });

  it("shouldRewriteHref ignora mailto/anchor/já-rastreado", () => {
    expect(shouldRewriteHref("https://exemplo.com")).toBe(true);
    expect(shouldRewriteHref("mailto:a@b.com")).toBe(false);
    expect(shouldRewriteHref("#top")).toBe(false);
    expect(shouldRewriteHref(`${BASE}/api/public/track/click?tp=x&l=y`)).toBe(false);
    expect(shouldRewriteHref("javascript:alert(1)")).toBe(false);
  });

  it("extractTrackableLinks retorna URLs únicas absolutas", () => {
    const html = `
      <a href="https://a.com/1">A</a>
      <a href='https://a.com/1'>A dup</a>
      <a href="mailto:x@y.com">mail</a>
      <a href="https://b.com/2">B</a>
    `;
    expect(extractTrackableLinks(html).sort()).toEqual([
      "https://a.com/1",
      "https://b.com/2",
    ]);
  });

  it("injectTracking reescreve links mapeados e injeta pixel antes de </body>", () => {
    const html = `<html><body>
      <p>Ola <a href="https://exemplo.com/promo">clique</a> agora.</p>
      <a href="mailto:x@y.com">contato</a>
    </body></html>`;
    const out = injectTracking(html, {
      trackingId: TID,
      baseUrl: BASE,
      linkMap: { "https://exemplo.com/promo": "LNK1" },
    });
    expect(out).toContain(
      `href="${BASE}/api/public/track/click?tp=${TID}&l=LNK1"`,
    );
    // mailto preservado
    expect(out).toContain('href="mailto:x@y.com"');
    // pixel inserido antes de </body>
    expect(out).toMatch(
      new RegExp(`<img[^>]+open\\.gif\\?tp=${TID}[^>]+></body>`),
    );
  });

  it("injectTracking é idempotente: não reescreve links já apontando para o proxy", () => {
    const html = `<a href="${BASE}/api/public/track/click?tp=${TID}&l=LNK1">x</a>`;
    const out = injectTracking(html, {
      trackingId: TID,
      baseUrl: BASE,
      linkMap: { [`${BASE}/api/public/track/click?tp=${TID}&l=LNK1`]: "LNK2" },
    });
    // permanece a URL de proxy original
    expect(out).toContain(
      `${BASE}/api/public/track/click?tp=${TID}&l=LNK1`,
    );
  });

  it("injectTracking apenda pixel no fim quando não há </body>", () => {
    const out = injectTracking("<p>oi</p>", { trackingId: TID, baseUrl: BASE });
    expect(out).toMatch(/<p>oi<\/p><img[^>]+open\.gif\?tp=/);
  });

  it("respeita injectPixel:false / rewriteLinks:false", () => {
    const html = `<a href="https://a.com/1">x</a>`;
    const out = injectTracking(html, {
      trackingId: TID,
      baseUrl: BASE,
      linkMap: { "https://a.com/1": "L" },
      injectPixel: false,
      rewriteLinks: false,
    });
    expect(out).toBe(html);
  });
});
