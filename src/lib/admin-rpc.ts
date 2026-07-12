import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side wrapper para chamar funções admin_* via edge function service_role.
 * As funções admin_* não são mais executáveis por authenticated diretamente —
 * este proxy verifica JWT + role admin antes de executar.
 */
export async function adminRpc<T = unknown>(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<{ data: T; error?: string }>(
    "admin-rpc",
    { body: { fn, args } },
  );
  if (error) throw error;
  if (!data || (data as { error?: string }).error) {
    throw new Error((data as { error?: string })?.error ?? "admin_rpc_failed");
  }
  return (data as { data: T }).data;
}
