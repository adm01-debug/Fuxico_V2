import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  canSignerSign,
  hashSignature,
  isExpired,
  pendingSigners,
  resolveRequestStatus,
} from './signatures.ts';

const NOW = new Date('2026-11-26T12:00:00.000Z');

Deno.test('canSignerSign aceita pending e viewed dentro do prazo', () => {
  assert(canSignerSign('pending', '2026-11-27T12:00:00.000Z', NOW));
  assert(canSignerSign('viewed', '2026-11-27T12:00:00.000Z', NOW));
  assert(canSignerSign('pending', null, NOW));
});

Deno.test('canSignerSign recusa signer ja assinado, declinado ou expirado', () => {
  assert(!canSignerSign('signed', null, NOW));
  assert(!canSignerSign('declined', null, NOW));
  assert(!canSignerSign('pending', '2026-11-26T11:59:00.000Z', NOW));
});

Deno.test('isExpired trata prazo inexistente e invalido como nao expirado', () => {
  assertEquals(isExpired(null, NOW), false);
  assertEquals(isExpired(undefined, NOW), false);
  assertEquals(isExpired('nao-e-data', NOW), false);
  assertEquals(isExpired('2026-11-26T12:00:00.000Z', NOW), true);
});

Deno.test('resolveRequestStatus: todos assinados => completed', () => {
  const status = resolveRequestStatus([{ status: 'signed' }, { status: 'signed' }], null, NOW);
  assertEquals(status, 'completed');
});

Deno.test('resolveRequestStatus: assinatura parcial => in_progress', () => {
  const status = resolveRequestStatus([{ status: 'signed' }, { status: 'pending' }], null, NOW);
  assertEquals(status, 'in_progress');
});

Deno.test('resolveRequestStatus: nenhum assinado => sent', () => {
  assertEquals(resolveRequestStatus([{ status: 'pending' }], null, NOW), 'sent');
  assertEquals(resolveRequestStatus([{ status: 'viewed' }], null, NOW), 'sent');
});

Deno.test('resolveRequestStatus: expirada tem precedencia sobre concluida', () => {
  const status = resolveRequestStatus([{ status: 'signed' }], '2026-11-26T11:00:00.000Z', NOW);
  assertEquals(status, 'expired');
});

Deno.test('pendingSigners ignora assinados e ordena por ordem', () => {
  const result = pendingSigners([
    { status: 'pending', order: 2 },
    { status: 'signed', order: 1 },
    { status: 'viewed', order: 3 },
    { status: 'declined', order: 4 },
  ]);
  assertEquals(
    result.map((s) => s.order),
    [2, 3]
  );
});

Deno.test('hashSignature e estavel e muda com o conteudo', async () => {
  const a = await hashSignature('doc-1', 'a@b.com', 'assinatura', '2026-11-26T12:00:00.000Z');
  const b = await hashSignature('doc-1', 'a@b.com', 'assinatura', '2026-11-26T12:00:00.000Z');
  const c = await hashSignature('doc-1', 'a@b.com', 'outra', '2026-11-26T12:00:00.000Z');
  assertEquals(a, b);
  assert(a !== c);
  assertEquals(a.length, 64);
});
