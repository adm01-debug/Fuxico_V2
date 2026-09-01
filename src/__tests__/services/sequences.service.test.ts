import { describe, it, expect, vi, beforeEach } from "vitest";

function makeBuilder(result: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "order"]) b[m] = vi.fn(() => b);
  b.single = vi.fn(() => Promise.resolve(result));
  b.maybeSingle = vi.fn(() => Promise.resolve(result));
  b.then = (onF: (v: unknown) => unknown) => Promise.resolve(result).then(onF);
  return b;
}

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));

import { sequencesService } from "@/services/sequences.service";
import { OptimisticLockError } from "@/services/campaigns.service";

beforeEach(() => fromMock.mockReset());

describe("sequencesService", () => {
  it("list usa a tabela email_sequences", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [{ id: "s1" }], error: null }));
    const r = await sequencesService.list("u1");
    expect(r).toEqual([{ id: "s1" }]);
    expect(fromMock).toHaveBeenCalledWith("email_sequences");
  });

  it("getById retorna null quando não encontra", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: null }));
    expect(await sequencesService.getById("nope")).toBeNull();
  });

  it("create propaga erro", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: new Error("insert failed") }));
    await expect(
      sequencesService.create({ user_id: "u1", name: "seq" } as never),
    ).rejects.toThrow("insert failed");
  });

  it("update lança OptimisticLockError em conflito de versão", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: null }));
    await expect(
      sequencesService.update("s1", 1, { name: "z" } as never),
    ).rejects.toBeInstanceOf(OptimisticLockError);
  });

  it("update retorna versão nova", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: { id: "s1", version: 2 }, error: null }));
    const r = await sequencesService.update("s1", 1, { name: "z" } as never);
    expect(r.version).toBe(2);
  });

  it("remove sucesso não lança", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: null }));
    await expect(sequencesService.remove("s1")).resolves.toBeUndefined();
  });
});
