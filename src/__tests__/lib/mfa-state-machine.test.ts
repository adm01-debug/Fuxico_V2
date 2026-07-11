import { describe, it, expect, vi } from 'vitest';
import { mfaReducer, type MFAState } from '@/lib/mfa-state-machine';

describe('mfaReducer › transições válidas', () => {
  it('idle → sending_code via REQUEST_CODE', () => {
    const next = mfaReducer({ status: 'idle' }, { type: 'REQUEST_CODE' });
    expect(next).toEqual({ status: 'sending_code' });
  });

  it('sending_code → awaiting_code via CODE_SENT', () => {
    const expiresAt = Date.now() + 60_000;
    const next = mfaReducer(
      { status: 'sending_code' },
      { type: 'CODE_SENT', expiresAt },
    );
    expect(next).toEqual({ status: 'awaiting_code', expiresAt });
  });

  it('sending_code → error via REJECTED', () => {
    const next = mfaReducer(
      { status: 'sending_code' },
      { type: 'REJECTED', message: 'SMS provider down' },
    );
    expect(next).toEqual({ status: 'error', message: 'SMS provider down' });
  });

  it('awaiting_code → verifying via SUBMIT_CODE', () => {
    const next = mfaReducer(
      { status: 'awaiting_code', expiresAt: 1 },
      { type: 'SUBMIT_CODE', code: '123456' },
    );
    expect(next).toEqual({ status: 'verifying' });
  });

  it('awaiting_code → locked via LOCKOUT', () => {
    const until = Date.now() + 30_000;
    const next = mfaReducer(
      { status: 'awaiting_code', expiresAt: 1 },
      { type: 'LOCKOUT', until },
    );
    expect(next).toEqual({ status: 'locked', until });
  });

  it('verifying → success via VERIFIED', () => {
    const next = mfaReducer({ status: 'verifying' }, { type: 'VERIFIED' });
    expect(next).toEqual({ status: 'success' });
  });

  it('verifying → error via REJECTED', () => {
    const next = mfaReducer(
      { status: 'verifying' },
      { type: 'REJECTED', message: 'bad code' },
    );
    expect(next).toEqual({ status: 'error', message: 'bad code' });
  });

  it('verifying → locked via LOCKOUT', () => {
    const until = Date.now() + 5000;
    const next = mfaReducer(
      { status: 'verifying' },
      { type: 'LOCKOUT', until },
    );
    expect(next).toEqual({ status: 'locked', until });
  });

  it('error → idle via RESET', () => {
    const next = mfaReducer(
      { status: 'error', message: 'x' },
      { type: 'RESET' },
    );
    expect(next).toEqual({ status: 'idle' });
  });

  it('success → idle via RESET', () => {
    const next = mfaReducer({ status: 'success' }, { type: 'RESET' });
    expect(next).toEqual({ status: 'idle' });
  });
});

describe('mfaReducer › lockout gating', () => {
  it('locked NÃO libera antes do until', () => {
    const until = Date.now() + 60_000;
    const state: MFAState = { status: 'locked', until };
    const next = mfaReducer(state, { type: 'RESET' });
    expect(next).toBe(state); // referência preservada = ignorado
  });

  it('locked libera após until via RESET', () => {
    const state: MFAState = { status: 'locked', until: Date.now() - 1000 };
    const next = mfaReducer(state, { type: 'RESET' });
    expect(next).toEqual({ status: 'idle' });
  });
});

describe('mfaReducer › transições inválidas ignoradas', () => {
  it('idle ignora VERIFIED', () => {
    const state: MFAState = { status: 'idle' };
    expect(mfaReducer(state, { type: 'VERIFIED' })).toBe(state);
  });

  it('awaiting_code ignora REQUEST_CODE (evita duplo envio)', () => {
    const state: MFAState = { status: 'awaiting_code', expiresAt: 1 };
    expect(mfaReducer(state, { type: 'REQUEST_CODE' })).toBe(state);
  });

  it('success ignora eventos que não sejam RESET', () => {
    const state: MFAState = { status: 'success' };
    expect(mfaReducer(state, { type: 'VERIFIED' })).toBe(state);
    expect(mfaReducer(state, { type: 'REQUEST_CODE' })).toBe(state);
  });
});

describe('mfaReducer › determinismo', () => {
  it('mesma entrada produz mesma saída (sem side effects)', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const state: MFAState = { status: 'idle' };
    const a = mfaReducer(state, { type: 'REQUEST_CODE' });
    const b = mfaReducer(state, { type: 'REQUEST_CODE' });
    expect(a).toEqual(b);
    vi.restoreAllMocks();
  });
});
