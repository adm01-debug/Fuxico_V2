/**
 * Utilitários de aleatoriedade.
 *
 * Regra do projeto:
 * - Qualquer valor com relevância de segurança (códigos de backup MFA, tokens,
 *   nonces) DEVE usar `crypto.getRandomValues` (CSPRNG).
 * - Valores puramente cosméticos (animações, skeletons, dados de demonstração)
 *   podem usar `cosmeticRandom`, que é explicitamente marcado como não-seguro
 *   para evitar falsos positivos de auditoria e uso indevido.
 */

const CROCKFORD_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ0123456789'; // 32 chars, sem I/L/O/U

function getCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c?.getRandomValues) {
    throw new Error('Web Crypto API indisponível neste ambiente.');
  }
  return c;
}

/** Inteiro criptograficamente seguro em [0, maxExclusive) sem viés de módulo. */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > 0x1_0000_0000) {
    throw new RangeError('maxExclusive deve ser um inteiro em (0, 2^32].');
  }
  const crypto = getCrypto();
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit); // rejeição para eliminar viés
  return value % maxExclusive;
}

/** String aleatória segura usando alfabeto Crockford (sem caracteres ambíguos). */
export function secureRandomString(length: number, alphabet: string = CROCKFORD_ALPHABET): string {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError('length deve ser um inteiro positivo.');
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[secureRandomInt(alphabet.length)];
  }
  return out;
}

/**
 * Gera códigos de backup MFA no formato `XXXX-XXXX`.
 * Garante unicidade dentro do lote.
 */
export function generateBackupCodes(count: number, groupSize = 4, groups = 2): string[] {
  const codes = new Set<string>();
  let guard = 0;
  while (codes.size < count && guard < count * 50) {
    guard++;
    const parts = Array.from({ length: groups }, () => secureRandomString(groupSize));
    codes.add(parts.join('-'));
  }
  if (codes.size < count) {
    throw new Error('Falha ao gerar códigos de backup únicos.');
  }
  return Array.from(codes);
}

/**
 * Aleatoriedade NÃO criptográfica, apenas para efeitos visuais/demonstração.
 * Nunca utilize para tokens, senhas, IDs de sessão ou códigos de recuperação.
 */
export function cosmeticRandom(): number {
  // eslint-disable-next-line sonarjs/pseudo-random -- uso exclusivamente cosmético (animações/skeletons)
  return Math.random();
}

/** Float cosmético em [min, max). */
export function cosmeticRange(min: number, max: number): number {
  return min + cosmeticRandom() * (max - min);
}

/** Inteiro cosmético em [min, max]. */
export function cosmeticInt(min: number, max: number): number {
  return Math.floor(cosmeticRange(min, max + 1));
}
