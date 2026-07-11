// =============================================================================
// Services Layer — Email Sequences
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { OptimisticLockError } from "./campaigns.service";

type SequenceRow = Database["public"]["Tables"]["email_sequences"]["Row"];
type SequenceInsert = Database["public"]["Tables"]["email_sequences"]["Insert"];
type SequenceUpdate = Database["public"]["Tables"]["email_sequences"]["Update"];

export const sequencesService = {
  async list(userId: string): Promise<SequenceRow[]> {
    const { data, error } = await supabase
      .from("email_sequences")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<SequenceRow | null> {
    const { data, error } = await supabase
      .from("email_sequences")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(payload: Omit<SequenceInsert, "id" | "created_at" | "updated_at" | "version">): Promise<SequenceRow> {
    const { data, error } = await supabase
      .from("email_sequences")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, expectedVersion: number, patch: SequenceUpdate): Promise<SequenceRow> {
    const { data, error } = await supabase
      .from("email_sequences")
      .update(patch)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new OptimisticLockError("email_sequences", id);
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("email_sequences").delete().eq("id", id);
    if (error) throw error;
  },
};

export type { SequenceRow, SequenceInsert, SequenceUpdate };
