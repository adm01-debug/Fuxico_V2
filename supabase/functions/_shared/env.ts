// =============================================================================
// FUXICO — Helper de leitura de variáveis de ambiente
// Substitui asserções não-nulas (`!`) por falha explícita e rastreável.
// =============================================================================

/**
 * Lê uma variável de ambiente obrigatória.
 * @throws Error quando a variável não está definida ou está vazia.
 */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
