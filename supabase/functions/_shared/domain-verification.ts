// =============================================================================
// FUXICO - Verificacao de posse de dominio
// Consulta a prova publica escolhida pelo usuario (TXT, arquivo ou meta tag).
// Mantido sem dependencias externas para poder ser testado com fetch mockado.
// =============================================================================

export const FETCH_TIMEOUT_MS = 8000;
export const MAX_RESPONSE_CHARS = 64 * 1024;

export interface VerificationResult {
  verified: boolean;
  message: string;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {}
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    console.warn("[verify-custom-domain] falha na consulta externa", url, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function readLimited(response: Response): Promise<string> {
  const text = await response.text();
  return text.slice(0, MAX_RESPONSE_CHARS);
}

export async function checkDnsRecord(domain: string, token: string): Promise<VerificationResult> {
  const response = await fetchWithTimeout(
    `https://cloudflare-dns.com/dns-query?name=_fuxico.${domain}&type=TXT`,
    { headers: { accept: "application/dns-json" } }
  );
  if (!response || !response.ok) {
    return {
      verified: false,
      message:
        "Nao foi possivel consultar o DNS publico agora. Tente novamente em alguns instantes.",
    };
  }
  const payload = (await response.json().catch(() => null)) as {
    Answer?: Array<{ data?: string }>;
  } | null;
  const answers = Array.isArray(payload?.Answer) ? payload.Answer : [];
  const found = answers.some((answer) => typeof answer?.data === "string" && answer.data.includes(token));
  return found
    ? { verified: true, message: "Registro TXT encontrado no DNS." }
    : {
        verified: false,
        message: `Registro TXT _fuxico.${domain} nao encontrado. A propagacao do DNS pode levar alguns minutos.`,
      };
}

export async function checkVerificationFile(
  domain: string,
  token: string
): Promise<VerificationResult> {
  const response = await fetchWithTimeout(`https://${domain}/${token}.txt`);
  if (!response || !response.ok) {
    return {
      verified: false,
      message: `Arquivo https://${domain}/${token}.txt nao encontrado ou inacessivel.`,
    };
  }
  const body = await readLimited(response);
  return body.includes(token)
    ? { verified: true, message: "Arquivo de verificacao encontrado." }
    : { verified: false, message: "O arquivo foi encontrado, mas o conteudo nao confere com o token." };
}

export async function checkMetaTag(domain: string, token: string): Promise<VerificationResult> {
  const response = await fetchWithTimeout(`https://${domain}/`);
  if (!response || !response.ok) {
    return {
      verified: false,
      message: `Nao foi possivel abrir https://${domain}/ para ler a meta tag.`,
    };
  }
  const html = await readLimited(response);
  return html.includes(token)
    ? { verified: true, message: "Meta tag de verificacao encontrada na pagina inicial." }
    : { verified: false, message: "Meta tag de verificacao nao encontrada na pagina inicial." };
}

export async function verifyOwnership(
  verificationType: string,
  domain: string,
  token: string
): Promise<VerificationResult> {
  if (verificationType === "file") return checkVerificationFile(domain, token);
  if (verificationType === "meta") return checkMetaTag(domain, token);
  return checkDnsRecord(domain, token);
}
