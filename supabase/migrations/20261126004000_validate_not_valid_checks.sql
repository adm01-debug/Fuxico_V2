-- =============================================================================
-- Integridade: 9 CHECK constraints estavam como NOT VALID em producao.
--
-- Projeto de producao: xmyvefffgltlrobazrmg
--
-- `NOT VALID` faz o CHECK valer apenas para INSERT/UPDATE novos: as linhas que ja
-- existiam nunca foram verificadas. Na pratica essas tabelas carregavam regras de
-- negocio (status permitido, faixa de score, formato de e-mail, passo >= 0) que
-- nunca foram aplicadas ao historico -- e qualquer linha antiga fora da regra
-- jamais seria detectada.
--
-- Medicao ANTES de validar (contagem de linhas que violam cada CHECK, usando
-- `(expr) IS FALSE` para replicar exatamente a semantica do CHECK, em que NULL
-- nao viola):
--
--   campaigns.status_valid                         0
--   contact_scores.engagement_range                0
--   follow_up_reminders.status_valid               0
--   scheduled_emails.status_valid                  0
--   sequence_enrollments.current_step_nonneg       0
--   sequence_enrollments.status_valid              0
--   tracked_emails.delivery_status_valid           0
--   tracked_emails.recipient_email_format           0
--   tracked_emails.sender_email_format              0
--
-- Como o historico ja respeita as 9 regras, `VALIDATE CONSTRAINT` pode rodar sem
-- correcao de dados e sem risco de falha. Em tabelas desse porte a validacao e
-- instantanea e usa SHARE UPDATE EXCLUSIVE, que nao bloqueia leitura nem escrita.
--
-- DEPOIS: `SELECT count(*) FROM pg_constraint WHERE connamespace='public'::regnamespace
--          AND NOT convalidated AND conislocal` -> 0
--
-- Idempotente: rodar novamente em um banco ja validado e um no-op silencioso.
-- =============================================================================

ALTER TABLE public.campaigns            VALIDATE CONSTRAINT campaigns_status_valid;
ALTER TABLE public.contact_scores       VALIDATE CONSTRAINT contact_scores_engagement_range;
ALTER TABLE public.follow_up_reminders  VALIDATE CONSTRAINT follow_up_reminders_status_valid;
ALTER TABLE public.scheduled_emails     VALIDATE CONSTRAINT scheduled_emails_status_valid;
ALTER TABLE public.sequence_enrollments VALIDATE CONSTRAINT sequence_enrollments_current_step_nonneg;
ALTER TABLE public.sequence_enrollments VALIDATE CONSTRAINT sequence_enrollments_status_valid;
ALTER TABLE public.tracked_emails       VALIDATE CONSTRAINT tracked_emails_delivery_status_valid;
ALTER TABLE public.tracked_emails       VALIDATE CONSTRAINT tracked_emails_recipient_email_format;
ALTER TABLE public.tracked_emails       VALIDATE CONSTRAINT tracked_emails_sender_email_format;