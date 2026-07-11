import { describe, it, expect, vi, beforeEach } from "vitest";

// Chainable builder that resolves with configured data/error on terminal await.
function makeBuilder(result: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {};
  const chain = ["select", "insert", "update", "delete", "eq", "order"];
  for (const m of chain) b[m] = vi.fn(() => b);
  b.single = vi.fn(() => Promise.resolve(result));
  b.maybeSingle = vi.fn(() => Promise.resolve(result));
  b.then = (onF: (v: unknown) => unknown) => Promise.resolve(result).then(onF);
  return b;
}

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));

import { campaignsService, OptimisticLockError } from "@/services/campaigns.service";

beforeEach(() => {
  fromMock.mockReset();
});

describe("campaignsService", () => {
  it("list retorna array vazio quando data é null", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: null }));
    const r = await campaignsService.list("u1");
    expect(r).toEqual([]);
    expect(fromMock).toHaveBeenCalledWith("campaigns");
  });

  it("list propaga erro do supabase", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: new Error("boom") }));
    await expect(campaignsService.list("u1")).rejects.toThrow("boom");
  });

  it("getById retorna row ou null", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: { id: "c1" }, error: null }));
    expect(await campaignsService.getById("c1")).toEqual({ id: "c1" });
  });

  it("create retorna row inserida", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: { id: "c2", name: "x" }, error: null }));
    const r = await campaignsService.create({ user_id: "u1", name: "x" } as never);
    expect(r).toEqual({ id: "c2", name: "x" });
  });

  it("update lança OptimisticLockError quando versão não bate", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: null }));
    await expect(
      campaignsService.update("c1", 3, { name: "y" } as never),
    ).rejects.toBeInstanceOf(OptimisticLockError);
  });

  it("update sucesso retorna nova versão", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: { id: "c1", version: 4 }, error: null }));
    const r = await campaignsService.update("c1", 3, { name: "y" } as never);
    expect(r.version).toBe(4);
  });

  it("remove propaga erro", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: new Error("nope") }));
    await expect(campaignsService.remove("c1")).rejects.toThrow("nope");
  });

  it("OptimisticLockError expõe resource e id", () => {
    const err = new OptimisticLockError("campaigns", "c1");
    expect(err.resource).toBe("campaigns");
    expect(err.id).toBe("c1");
    expect(err.name).toBe("OptimisticLockError");
  });
});
