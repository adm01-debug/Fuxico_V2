/**
 * Helpers de seleção condicional.
 *
 * Substituem cadeias de ternários aninhados (`a ? x : b ? y : z`) por uma
 * estrutura declarativa e legível, preservando **exatamente** a semântica
 * original:
 *
 * - as condições são avaliadas na ordem declarada;
 * - os valores são thunks, logo só o ramo vencedor é avaliado (lazy),
 *   evitando erros de acesso a propriedades de valores nulos que o
 *   curto-circuito do ternário protegia.
 */

/** Par condição/valor usado por {@link matchFirst}. */
export type MatchBranch<T> = readonly [condition: unknown, value: () => T];

/**
 * Retorna o valor do primeiro ramo cuja condição for verdadeira.
 * Se nenhuma condição for satisfeita, retorna o valor de `fallback`.
 *
 * @param branches Lista ordenada de pares `[condição, () => valor]`.
 * @param fallback Thunk avaliado quando nenhuma condição é verdadeira.
 */
export function matchFirst<T>(
  branches: ReadonlyArray<MatchBranch<T>>,
  fallback: () => T,
): T {
  for (const [condition, value] of branches) {
    if (condition) return value();
  }
  return fallback();
}

/**
 * Versão eager de {@link matchFirst} para valores já computados
 * (literais, tokens de classe, constantes). Não use quando algum valor
 * depender de uma condição anterior para ser seguro de avaliar.
 */
export function pickFirst<T>(
  branches: ReadonlyArray<readonly [condition: unknown, value: T]>,
  fallback: T,
): T {
  for (const [condition, value] of branches) {
    if (condition) return value;
  }
  return fallback;
}

/**
 * Mapeia um valor numérico para uma variante conforme limites crescentes.
 *
 * @param value Valor avaliado.
 * @param thresholds Pares `[limite, variante]` avaliados em ordem; a primeira
 *                   entrada com `value >= limite` vence.
 * @param fallback Variante retornada quando nenhum limite é atingido.
 */
export function thresholdVariant<T>(
  value: number,
  thresholds: ReadonlyArray<readonly [min: number, variant: T]>,
  fallback: T,
): T {
  for (const [min, variant] of thresholds) {
    if (value >= min) return variant;
  }
  return fallback;
}
