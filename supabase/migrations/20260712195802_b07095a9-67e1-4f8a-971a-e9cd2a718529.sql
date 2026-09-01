-- Anon: uso mínimo e limitado (endpoints públicos, opens/clicks)
ALTER ROLE anon SET statement_timeout = '3s';
ALTER ROLE anon SET idle_in_transaction_session_timeout = '5s';
ALTER ROLE anon SET lock_timeout = '2s';

-- Authenticated: dashboards e RPCs de usuário
ALTER ROLE authenticated SET statement_timeout = '15s';
ALTER ROLE authenticated SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE authenticated SET lock_timeout = '3s';

-- service_role: sem timeouts agressivos (edge functions e jobs longos)
ALTER ROLE service_role SET statement_timeout = '60s';
ALTER ROLE service_role SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE service_role SET lock_timeout = '10s';