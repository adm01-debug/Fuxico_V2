import { describe, expect, it } from "vitest";
import { UnauthenticatedError, requireUserId } from "@/lib/auth-guards";

describe("requireUserId", () => {
  it("retorna o id quando o usuário está autenticado", () => {
    expect(requireUserId({ id: "abc-123" })).toBe("abc-123");
  });

  it("lança UnauthenticatedError quando o usuário é null", () => {
    expect(() => requireUserId(null)).toThrow(UnauthenticatedError);
  });

  it("lança UnauthenticatedError quando o usuário é undefined", () => {
    expect(() => requireUserId(undefined)).toThrow(UnauthenticatedError);
  });

  it("lança quando o id é vazio (sessão corrompida)", () => {
    expect(() => requireUserId({ id: "" })).toThrow(UnauthenticatedError);
  });

  it("inclui o contexto informado na mensagem de erro", () => {
    expect(() => requireUserId(null, "criar campanha")).toThrow(
      /criar campanha/,
    );
  });

  it("usa contexto padrão quando nenhum é informado", () => {
    expect(() => requireUserId(null)).toThrow(/esta ação/);
  });
});
