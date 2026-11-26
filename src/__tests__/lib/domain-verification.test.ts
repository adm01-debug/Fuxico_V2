import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkDnsRecord,
  checkMetaTag,
  checkVerificationFile,
  fetchWithTimeout,
  verifyOwnership,
} from '../../../supabase/functions/_shared/domain-verification';

const DOMAIN = 'links.exemplo.com';
const TOKEN = 'fuxico-verify-11111111-2222-3333-4444-555555555555';

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function textResponse(body: string, ok = true) {
  return {
    ok,
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('checkDnsRecord', () => {
  it('aprova quando o TXT publicado contem o token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ Answer: [{ data: `"v=spf1 include:_spf.exemplo.com"` }, { data: TOKEN }] })
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await checkDnsRecord(DOMAIN, TOKEN);

    expect(result.verified).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toContain('_fuxico.links.exemplo.com');
  });

  it('reprova quando o TXT nao existe', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ Answer: [] })));

    const result = await checkDnsRecord(DOMAIN, TOKEN);

    expect(result.verified).toBe(false);
    expect(result.message).toContain('_fuxico.links.exemplo.com');
  });

  it('reprova quando o provedor de DNS responde erro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)));

    const result = await checkDnsRecord(DOMAIN, TOKEN);

    expect(result.verified).toBe(false);
    expect(result.message).toContain('DNS publico');
  });

  it('reprova quando a consulta estoura o tempo limite', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('aborted')));

    const result = await checkDnsRecord(DOMAIN, TOKEN);

    expect(result.verified).toBe(false);
  });
});

describe('checkVerificationFile', () => {
  it('aprova quando o arquivo publico contem o token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse(TOKEN)));

    const result = await checkVerificationFile(DOMAIN, TOKEN);

    expect(result.verified).toBe(true);
  });

  it('reprova quando o arquivo responde 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse('not found', false)));

    const result = await checkVerificationFile(DOMAIN, TOKEN);

    expect(result.verified).toBe(false);
  });
});

describe('checkMetaTag', () => {
  it('aprova quando a meta tag esta no HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          textResponse(
            `<html><head><meta name="fuxico-site-verification" content="${TOKEN}" /></head></html>`
          )
        )
    );

    const result = await checkMetaTag(DOMAIN, TOKEN);

    expect(result.verified).toBe(true);
  });

  it('reprova quando a pagina nao traz o token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse('<html></html>')));

    const result = await checkMetaTag(DOMAIN, TOKEN);

    expect(result.verified).toBe(false);
  });
});

describe('verifyOwnership', () => {
  it('usa DNS por padrao e respeita o tipo informado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse(TOKEN));
    vi.stubGlobal('fetch', fetchMock);

    await verifyOwnership('file', DOMAIN, TOKEN);
    expect(fetchMock.mock.calls[0][0]).toBe(`https://${DOMAIN}/${TOKEN}.txt`);

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(jsonResponse({ Answer: [{ data: TOKEN }] }));
    const dnsResult = await verifyOwnership('desconhecido', DOMAIN, TOKEN);
    expect(String(fetchMock.mock.calls[0][0])).toContain('cloudflare-dns.com');
    expect(dnsResult.verified).toBe(true);
  });

  it('devolve null quando o fetch falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));

    expect(await fetchWithTimeout('https://exemplo.com')).toBeNull();
  });
});
