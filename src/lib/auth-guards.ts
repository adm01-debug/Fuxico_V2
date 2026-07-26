import type { User } from "@supabase/supabase-js";

/**
 * Erro lançado quando uma operação que exige sessão autenticada é
 * executada sem usuário. Serve como sentinela explícita em vez de
 * uma asserção não-nula silenciosa (`user!.id`), que mascararia um
 * bug de orquestração de `enabled`/guards de rota.
 */
export class UnauthenticatedError extends Error {
  constructor(context = "operação") {
    super(`Sessão expirada: ${context} requer usuário autenticado.`);
    this.name = "UnauthenticatedError";
  }
}

/**
 * Extrai o id do usuário autenticado, falhando alto e cedo quando ausente.
 *
 * Uso típico em `queryFn`/`mutationFn` do TanStack Query, onde o hook já
 * está protegido por `enabled: !!user` — o guard aqui existe para o caso
 * (raro, mas real) de a sessão expirar entre o render e o disparo da query.
 */
export function requireUserId(
  user: Pick<User, "id"> | null | undefined,
  context = "esta ação",
): string {
  if (!user?.id) throw new UnauthenticatedError(context);
  return user.id;
}
