-- ============================================================================
-- Restaura 13 tabelas que as edge functions jÃ¡ usam mas que nunca chegaram ao
-- banco. Cinco delas tÃªm CREATE TABLE em migrations antigas (20251219/20251223)
-- cujas colunas divergem do cÃ³digo atual; oito nunca tiveram tabela alguma.
--
-- EVIDÃŠNCIA DA AUSÃŠNCIA (produÃ§Ã£o, antes desta migration):
--   select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
--   where n.nspname='public' and relname in (<as 13>);
--   -> 0 linhas.
--
-- EVIDÃŠNCIA DO USO (origin/main -> supabase/functions/*/index.ts), todas ACTIVE:
--   vote-poll                -> polls, poll_options, poll_votes
--   send-signature-request   -> signature_requests, signature_signers
--   verify-custom-domain     -> custom_domains
--   zapier-webhook           -> api_keys
--   generate-signed-document -> document_signatures
--   bitrix24-sync            -> bitrix24_sync_logs
--   send-mass-email          -> mass_email_campaigns
--   send-push-notification   -> push_notifications
--   send-batch-emails        -> email_batches
--   send-mail-merge          -> mail_merge_jobs
-- Resultado: toda chamada a essas 10 functions retornava 500 do PostgREST
-- ("relation does not exist") â€” funcionalidade morta e silenciosa.
--
-- As colunas seguem o CÃ“DIGO, nÃ£o as migrations antigas. DivergÃªncias
-- encontradas e resolvidas aqui: polls.status e polls.allow_multiple_votes
-- (a antiga tinha multiple_choice), signature_requests.user_id (a antiga tinha
-- sender_id NOT NULL), bitrix24_sync_logs.metadata (a antiga tinha request_data
-- e entity_type NOT NULL), custom_domains.verification_type/status/updated_at.
--
-- RLS: habilitado em todas. Policy de escrita por owner apenas onde a function
-- escreve com a chave ANÃ”NIMA carregando o JWT do usuÃ¡rio; onde ela usa
-- service_role nÃ£o hÃ¡ policy de escrita (service_role ignora RLS).
-- `anon` Ã© revogado de todas â€” nenhuma dessas tabelas Ã© pÃºblica.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enquetes (vote-poll usa service_role)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  allow_multiple_votes boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  total_votes integer NOT NULL DEFAULT 0 CHECK (total_votes >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS allow_multiple_votes boolean NOT NULL DEFAULT false;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_polls_user_id ON public.polls(user_id);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  votes_count integer NOT NULL DEFAULT 0 CHECK (votes_count >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  voter_ip text,
  voter_email text,
  voter_name text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.poll_votes ADD COLUMN IF NOT EXISTS voter_email text;
ALTER TABLE public.poll_votes ADD COLUMN IF NOT EXISTS voter_name text;
ALTER TABLE public.poll_votes ADD COLUMN IF NOT EXISTS metadata jsonb;
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_ip ON public.poll_votes(poll_id, voter_ip);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option ON public.poll_votes(option_id);

-- RPC citada por vote-poll; o fallback do cÃ³digo nunca dispara porque
-- Promise.resolve() nÃ£o rejeita. Continua existindo para o caminho atÃ´mico.
CREATE OR REPLACE FUNCTION public.increment_poll_option_votes(p_option_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.poll_options
     SET votes_count = votes_count + 1
   WHERE id = p_option_id;

  UPDATE public.polls p
     SET total_votes = total_votes + 1,
         updated_at = now()
   WHERE p.id = (SELECT o.poll_id FROM public.poll_options o WHERE o.id = p_option_id);
END;
$$;
REVOKE ALL ON FUNCTION public.increment_poll_option_votes(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_poll_option_votes(uuid) TO service_role;

-- RPC citada por track-link e também inexistente no banco. Sem ela, o
-- click_count de tracked_links nunca era incrementado: o fallback do código
-- estava dentro de um .catch() de Promise.resolve(), que nunca rejeita.
CREATE OR REPLACE FUNCTION public.increment_link_click_count(p_link_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.tracked_links
     SET click_count = COALESCE(click_count, 0) + 1
   WHERE link_id = p_link_id;
$$;
REVOKE ALL ON FUNCTION public.increment_link_click_count(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_link_click_count(text) TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Assinatura eletrÃ´nica (send-signature-request usa anon + JWT do usuÃ¡rio)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'in_progress', 'completed', 'cancelled', 'expired')),
  message text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_signature_requests_user_id ON public.signature_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_document_id ON public.signature_requests(document_id);

CREATE TABLE IF NOT EXISTS public.signature_signers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  "order" integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'signed', 'declined')),
  token text NOT NULL UNIQUE,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_signature_signers_request_id ON public.signature_signers(request_id);

CREATE TABLE IF NOT EXISTS public.document_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  signature_type text NOT NULL DEFAULT 'type' CHECK (signature_type IN ('draw', 'type', 'upload')),
  signature_data text,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signer_ip text,
  position jsonb,
  hash text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_signatures_document_id ON public.document_signatures(document_id);

-- ---------------------------------------------------------------------------
-- 3. DomÃ­nios prÃ³prios e API keys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  verification_type text NOT NULL DEFAULT 'dns' CHECK (verification_type IN ('dns', 'file', 'meta')),
  verification_token text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  verified boolean NOT NULL DEFAULT false,
  ssl_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_domains ADD COLUMN IF NOT EXISTS verification_type text NOT NULL DEFAULT 'dns';
ALTER TABLE public.custom_domains ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.custom_domains ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  key text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- ---------------------------------------------------------------------------
-- 4. IntegraÃ§Ãµes, campanhas e notificaÃ§Ãµes push
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bitrix24_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  tracking_id text,
  email text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  metadata jsonb,
  request_data jsonb,
  response_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bitrix24_sync_logs ALTER COLUMN entity_type DROP NOT NULL;
ALTER TABLE public.bitrix24_sync_logs ADD COLUMN IF NOT EXISTS metadata jsonb;
CREATE INDEX IF NOT EXISTS idx_bitrix24_sync_logs_user_id ON public.bitrix24_sync_logs(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.mass_email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid,
  subject text NOT NULL,
  total_recipients integer NOT NULL DEFAULT 0 CHECK (total_recipients >= 0),
  track_opens boolean NOT NULL DEFAULT false,
  track_clicks boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mass_email_campaigns_user_id ON public.mass_email_campaigns(user_id);

CREATE TABLE IF NOT EXISTS public.push_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  icon text,
  url text,
  data jsonb,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_notifications_user_id ON public.push_notifications(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Envio em lote e mail merge
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_count integer NOT NULL DEFAULT 0 CHECK (total_count >= 0),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'scheduled', 'completed', 'failed', 'cancelled')),
  scheduled_at timestamptz,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_batches_user_id ON public.email_batches(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.mail_merge_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merge_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_name text,
  variables jsonb,
  tracking_id text,
  rendered_body text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mail_merge_jobs_merge_id ON public.mail_merge_jobs(merge_id);
CREATE INDEX IF NOT EXISTS idx_mail_merge_jobs_user_id ON public.mail_merge_jobs(user_id);

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.polls               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_signers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix24_sync_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mass_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_batches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_merge_jobs     ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.polls, public.poll_options, public.poll_votes,
              public.signature_requests, public.signature_signers, public.document_signatures,
              public.custom_domains, public.api_keys, public.bitrix24_sync_logs,
              public.mass_email_campaigns, public.push_notifications, public.email_batches,
              public.mail_merge_jobs
  FROM anon;

-- polls: escritas sÃ³ por service_role (vote-poll). Leitura pelo dono.
DROP POLICY IF EXISTS polls_select_own ON public.polls;
CREATE POLICY polls_select_own ON public.polls FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS poll_options_select_own ON public.poll_options;
CREATE POLICY poll_options_select_own ON public.poll_options FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_options.poll_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS poll_votes_select_own ON public.poll_votes;
CREATE POLICY poll_votes_select_own ON public.poll_votes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_votes.poll_id AND p.user_id = auth.uid()));

-- Assinatura: send-signature-request escreve com o JWT do usuÃ¡rio (role authenticated).
DROP POLICY IF EXISTS signature_requests_select_own ON public.signature_requests;
CREATE POLICY signature_requests_select_own ON public.signature_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS signature_requests_insert_own ON public.signature_requests;
CREATE POLICY signature_requests_insert_own ON public.signature_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS signature_requests_update_own ON public.signature_requests;
CREATE POLICY signature_requests_update_own ON public.signature_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS signature_signers_select_own ON public.signature_signers;
CREATE POLICY signature_signers_select_own ON public.signature_signers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.signature_requests r WHERE r.id = signature_signers.request_id AND r.user_id = auth.uid()));
DROP POLICY IF EXISTS signature_signers_insert_own ON public.signature_signers;
CREATE POLICY signature_signers_insert_own ON public.signature_signers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.signature_requests r WHERE r.id = signature_signers.request_id AND r.user_id = auth.uid()));
DROP POLICY IF EXISTS document_signatures_select_own ON public.document_signatures;
CREATE POLICY document_signatures_select_own ON public.document_signatures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tracked_documents d WHERE d.id = document_signatures.document_id AND d.user_id = auth.uid()));
DROP POLICY IF EXISTS document_signatures_insert_own ON public.document_signatures;
CREATE POLICY document_signatures_insert_own ON public.document_signatures FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tracked_documents d WHERE d.id = document_signatures.document_id AND d.user_id = auth.uid()));

-- custom_domains: verify-custom-domain faz upsert com o JWT do usuÃ¡rio.
DROP POLICY IF EXISTS custom_domains_select_own ON public.custom_domains;
CREATE POLICY custom_domains_select_own ON public.custom_domains FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS custom_domains_insert_own ON public.custom_domains;
CREATE POLICY custom_domains_insert_own ON public.custom_domains FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS custom_domains_update_own ON public.custom_domains;
CREATE POLICY custom_domains_update_own ON public.custom_domains FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- api_keys: criadas/lidas pelo dono; zapier-webhook valida com service_role.
DROP POLICY IF EXISTS api_keys_select_own ON public.api_keys;
CREATE POLICY api_keys_select_own ON public.api_keys FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS api_keys_insert_own ON public.api_keys;
CREATE POLICY api_keys_insert_own ON public.api_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS api_keys_update_own ON public.api_keys;
CREATE POLICY api_keys_update_own ON public.api_keys FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS bitrix24_sync_logs_select_own ON public.bitrix24_sync_logs;
CREATE POLICY bitrix24_sync_logs_select_own ON public.bitrix24_sync_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS bitrix24_sync_logs_insert_own ON public.bitrix24_sync_logs;
CREATE POLICY bitrix24_sync_logs_insert_own ON public.bitrix24_sync_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS mass_email_campaigns_select_own ON public.mass_email_campaigns;
CREATE POLICY mass_email_campaigns_select_own ON public.mass_email_campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS mass_email_campaigns_insert_own ON public.mass_email_campaigns;
CREATE POLICY mass_email_campaigns_insert_own ON public.mass_email_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS push_notifications_select_own ON public.push_notifications;
CREATE POLICY push_notifications_select_own ON public.push_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS push_notifications_insert_own ON public.push_notifications;
CREATE POLICY push_notifications_insert_own ON public.push_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS push_notifications_update_own ON public.push_notifications;
CREATE POLICY push_notifications_update_own ON public.push_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS email_batches_select_own ON public.email_batches;
CREATE POLICY email_batches_select_own ON public.email_batches FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS email_batches_insert_own ON public.email_batches;
CREATE POLICY email_batches_insert_own ON public.email_batches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS mail_merge_jobs_select_own ON public.mail_merge_jobs;
CREATE POLICY mail_merge_jobs_select_own ON public.mail_merge_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS mail_merge_jobs_insert_own ON public.mail_merge_jobs;
CREATE POLICY mail_merge_jobs_insert_own ON public.mail_merge_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. GRANTs
-- RLS não substitui privilégio de tabela: sem GRANT explícito, tanto
-- `authenticated` quanto `service_role` recebem 42501 (permission denied).
-- Tabelas criadas por SQL direto não herdam os default privileges do Supabase.
-- Concede-se a `authenticated` exatamente as operações que têm policy.
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.polls, public.poll_options, public.poll_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.signature_requests TO authenticated;
GRANT SELECT, INSERT ON public.signature_signers TO authenticated;
GRANT SELECT, INSERT ON public.document_signatures TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.custom_domains TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.api_keys TO authenticated;
GRANT SELECT, INSERT ON public.bitrix24_sync_logs TO authenticated;
GRANT SELECT, INSERT ON public.mass_email_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.push_notifications TO authenticated;
GRANT SELECT, INSERT ON public.email_batches TO authenticated;
GRANT SELECT, INSERT ON public.mail_merge_jobs TO authenticated;

GRANT ALL ON public.polls, public.poll_options, public.poll_votes,
             public.signature_requests, public.signature_signers, public.document_signatures,
             public.custom_domains, public.api_keys, public.bitrix24_sync_logs,
             public.mass_email_campaigns, public.push_notifications, public.email_batches,
             public.mail_merge_jobs
  TO service_role;
COMMENT ON TABLE public.polls IS 'Enquetes (vote-poll). Restaurada em 20261126: existia sÃ³ no cÃ³digo.';
COMMENT ON TABLE public.mail_merge_jobs IS 'Fila de mail merge (send-mail-merge). user_id preenchido por DEFAULT auth.uid().';