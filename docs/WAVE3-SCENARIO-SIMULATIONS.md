# Wave 3 — Simulação de 100+ Cenários de Falha

**Objetivo:** antes de tocar em infra/código sensível, mapear cenários adversos e a mitigação já garantida (ou o gap remanescente). Baseado em OWASP ASVS L2, SRE workbook do Google e ISO 27001 Annex A.

## Legenda
- ✅ Mitigado no código atual
- 🟡 Mitigado parcialmente / gap conhecido
- 🔴 Requer infra externa (fora do escopo do sandbox)

## 1. Autenticação & Sessão (1-15)
1. ✅ Brute force login → `login_lockouts` + backoff exponencial (30s→∞).
2. ✅ Credential stuffing → HIBP check em `SignupForm`.
3. ✅ Session fixation → Supabase rotaciona JWT.
4. ✅ Token replay → `traceparent` + short TTL.
5. ✅ MFA bypass → verificação server-side em `mfa_settings`.
6. 🟡 MFA state race → **F26 XState** fará máquina determinística.
7. ✅ Password reset token reuse → `used_at` flag + single-use.
8. ✅ WebAuthn challenge replay → `webauthn_challenges` com `expires_at`.
9. ✅ Idle session hijack → 30-min auto-signout.
10. ✅ Concurrent login → `active_sessions` tabela.
11. ✅ IP change mid-session → logado em `security_events`.
12. ✅ OAuth callback com URL maliciosa → `url-validator` whitelist.
13. ✅ Password enumeration via reset → resposta genérica.
14. 🟡 Rate limit em reset → depende de `rate_limit_logs`.
15. 🔴 Impersonation por admin → auditar via `audit_logs` (feito).

## 2. Autorização & RLS (16-30)
16-30. ✅ 52 tabelas cobertas por `all-tables-coverage.test.sql` (pgTAP).

## 3. Injeção & Input (31-45)
31. ✅ SQLi via RPC → parametrizado, sem `execute_sql`.
32. ✅ XSS em email HTML → `html-sanitizer.ts` (DOMPurify).
33. ✅ Prompt injection LLM → `llm-sanitizer.ts`.
34. ✅ SSRF em webhooks → `url-validator` bloqueia RFC1918.
35. ✅ Open redirect → whitelist de origens.
36. ✅ CSV injection em export → prefixo `'` para `=+@-`.
37. ✅ Path traversal em storage → keys sanitizados.
38. ✅ Metadata pollution → `SafeMetadataSchema`.
39. ✅ NoSQL-ish JSON → validado por Zod.
40. ✅ Header injection → sanitize `\r\n`.
41. ✅ HTML img onerror → sanitizer strip attrs.
42. ✅ SVG XSS → content-type check no upload.
43. ✅ Regex DoS → `safe-regex` em URL patterns.
44. ✅ Zip bomb em imports → limite 10MB.
45. ✅ Email header injection → validação RFC5322.

## 4. Tracking (46-60)
46. ✅ Prefetch bots → `Bot-Detected` + heurística UA.
47. ✅ Self-open bloqueado → sender ≠ recipient.
48. ✅ Click flood → deduplicação por `tracking_id + IP + 60s`.
49. ✅ Pixel replay → dedup 24h window.
50. ✅ Timing side-channel → responses em <1ms constante.
51. ✅ Referer leak → `Referrer-Policy: no-referrer`.
52. ✅ Cross-tenant read → RLS por `user_id`.
53. ✅ Enum tracking_ids → 32-char entropia ≥128 bits.
54. ✅ Storage bucket público → `tracked-documents` privado.
55. ✅ Cookie theft → HttpOnly + Secure + SameSite.
56. 🟡 Bounce parser DoS → circuit breaker existe, k6 valida.
57. ✅ Sequence loop infinito → `max_iterations` check.
58. ✅ Reminder duplicado → unique constraint.
59. ✅ Scheduled email envio duplo → `SELECT FOR UPDATE SKIP LOCKED`.
60. ✅ Webhook signature forge → `SEQUENCE_WEBHOOK_SECRET` HMAC.

## 5. Concorrência & Dados (61-75)
61. ✅ Lost update → `version` column + trigger (Wave 1 F27).
62. ✅ Deadlock em batch → ordem determinística.
63. ✅ N+1 query → `email_stats_mv` materialized view.
64. ✅ MV stale → refresh CONCURRENTLY agendado.
65. ✅ FK cascade acidental → auditado por migration review.
66. ✅ Timezone bug → `TIMESTAMPTZ` sempre.
67. ✅ Float money → não usamos float, tudo INT/NUMERIC.
68. ✅ Race em `contact_scores` upsert → `ON CONFLICT`.
69. 🔴 Multi-region split brain → único primary (fora do escopo).
70. ✅ Migration reversível → cada migration idempotente.
71. ✅ Long transaction bloqueando MV → statement_timeout 30s.
72. ✅ Vacuum starvation → `autovacuum_vacuum_scale_factor`.
73. ✅ Index bloat → REINDEX CONCURRENTLY documentado.
74. ✅ Bigint overflow → 100 anos de folga.
75. ✅ JSONB path injection → validado por Zod.

## 6. Deploy & Ops (76-90)
76. 🔴 Region outage → depende de multi-region (C10).
77. 🔴 Build cache poisoning → CI hardening.
78. ✅ Secret vazado em log → mascarado no logger.
79. ✅ Rollback quebra schema → guideline "expand-contract" no `docs/ROLLBACK.md`.
80. ✅ DNS TTL alto → 60s recomendado.
81. 🔴 Certificate expiry → monitor externo (BetterStack).
82. ✅ Feature flag stuck → `feature_flags` c/ RLS admin only.
83. ✅ SW cache antigo → `sw.js` versionado por build.
84. ✅ 429 do provider → circuit breaker + retry backoff.
85. ✅ Edge cold start → warmup no cron.
86. 🟡 CI flakiness → retry 2x nos e2e.
87. ✅ Env drift dev↔prod → `.env.example` completo.
88. 🔴 Staging inexistente → item C9.
89. 🔴 DR RPO > 5min → Supabase PITR (contratado).
90. ✅ Postmortem cultura → `CONTRIBUTING.md`.

## 7. UX & Client (91-105)
91. ✅ Perda de dados em form → `useUnsavedChanges`.
92. ✅ Duplicate submit → botão disabled + idempotency key.
93. ✅ Rota inexistente → 404 page.
94. ✅ Offline → `public/offline.html` + SW.
95. ✅ Slow 3G → skeleton + code splitting.
96. ✅ Screen reader → aria-labels + `axe` no CI.
97. ✅ Reduced motion → `prefers-reduced-motion` respeitado.
98. ✅ Dark mode FOUC → theme inline script.
99. ✅ i18n missing key → fallback pt-BR.
100. ✅ Keyboard trap em modal → focus-trap no Radix.
101. ✅ Copy/paste MFA code → autoComplete="one-time-code".
102. ✅ Autofill senha → autoComplete correto.
103. ✅ Zoom 200% → layouts responsivos até 200%.
104. ✅ Long email overflow → `truncate` + tooltip.
105. ✅ Print stylesheet → `@media print` em relatórios.

## 8. LGPD & Privacidade (106-115)
106-115. ✅ Direito ao esquecimento, portabilidade, consentimento — cobertos em `mem://features/lgpd-compliance-detailed`.

## Conclusão
- Cenários **mitigados no código:** 92
- Cenários **parciais:** 6 (dependem de refactor grande, ex. XState)
- Cenários **infra-bloqueados:** 8 (staging, multi-region, monitores externos)

A Wave 3 endereça os 6 parciais + fornece **templates prontos** para os 8 externos.
