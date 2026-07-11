// =============================================================================
// Services Layer — Campaigns
// Separação de I/O do Supabase dos hooks React Query (ADR pendente F25).
// Todos os métodos são puros, tipados e recebem o cliente Supabase como dep.
// Isso facilita mock em testes e reutilização em Edge Functions.
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
type CampaignUpdate = Database["public"]["Tables"]["campaigns"]["Update"];

export class OptimisticLockError extends Error {
  constructor(public readonly resource: string, public readonly id: string) {
    super(`Conflito de edição em ${resource}#${id}. Recarregue e tente novamente.`);
    this.name = "OptimisticLockError";
  }
}

export const campaignsService = {
  async list(userId: string): Promise<CampaignRow[]> {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<CampaignRow | null> {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(payload: Omit<CampaignInsert, "id" | "created_at" | "updated_at" | "version">): Promise<CampaignRow> {
    const { data, error } = await supabase
      .from("campaigns")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Update com optimistic locking: exige `expectedVersion`.
   * Se a versão no banco for diferente, lança `OptimisticLockError`.
   */
  async update(id: string, expectedVersion: number, patch: CampaignUpdate): Promise<CampaignRow> {
    const { data, error } = await supabase
      .from("campaigns")
      .update(patch)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new OptimisticLockError("campaigns", id);
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) throw error;
  },
};

export type { CampaignRow, CampaignInsert, CampaignUpdate };
