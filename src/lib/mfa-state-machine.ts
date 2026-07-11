/**
 * MFA state machine — determinística, evita race conditions do fluxo antigo.
 * Não usamos XState como dependência (evita 40KB) — implementação enxuta.
 */
export type MFAState =
  | { status: "idle" }
  | { status: "sending_code" }
  | { status: "awaiting_code"; expiresAt: number }
  | { status: "verifying" }
  | { status: "success" }
  | { status: "locked"; until: number }
  | { status: "error"; message: string };

export type MFAEvent =
  | { type: "REQUEST_CODE" }
  | { type: "CODE_SENT"; expiresAt: number }
  | { type: "SUBMIT_CODE"; code: string }
  | { type: "VERIFIED" }
  | { type: "REJECTED"; message: string }
  | { type: "LOCKOUT"; until: number }
  | { type: "RESET" };

export function mfaReducer(state: MFAState, event: MFAEvent): MFAState {
  switch (state.status) {
    case "idle":
      if (event.type === "REQUEST_CODE") return { status: "sending_code" };
      break;
    case "sending_code":
      if (event.type === "CODE_SENT") return { status: "awaiting_code", expiresAt: event.expiresAt };
      if (event.type === "REJECTED") return { status: "error", message: event.message };
      break;
    case "awaiting_code":
      if (event.type === "SUBMIT_CODE") return { status: "verifying" };
      if (event.type === "LOCKOUT") return { status: "locked", until: event.until };
      break;
    case "verifying":
      if (event.type === "VERIFIED") return { status: "success" };
      if (event.type === "REJECTED") return { status: "error", message: event.message };
      if (event.type === "LOCKOUT") return { status: "locked", until: event.until };
      break;
    case "locked":
      if (event.type === "RESET" && Date.now() > state.until) return { status: "idle" };
      break;
    case "error":
      if (event.type === "RESET") return { status: "idle" };
      break;
    case "success":
      if (event.type === "RESET") return { status: "idle" };
      break;
  }
  return state; // invalid transitions ignored
}
