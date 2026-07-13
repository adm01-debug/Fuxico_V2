-- Move btree_gist do schema public para o schema extensions dedicado
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
ALTER EXTENSION btree_gist SET SCHEMA extensions;