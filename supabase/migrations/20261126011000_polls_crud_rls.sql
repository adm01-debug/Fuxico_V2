-- =============================================================================
-- FUXICO - Enquetes: CRUD do dono via RLS
-- Arquivo: supabase/migrations/20261126011000_polls_crud_rls.sql
--
-- Causa: as tabelas polls / poll_options / poll_votes tinham somente SELECT para
-- o role authenticated, embora a edge publica vote-poll ja estivesse pronta em
-- producao. Resultado: a funcionalidade de enquetes existia no backend e no
-- banco, mas nenhuma tela podia criar, encerrar ou excluir uma enquete.
-- As policies abaixo liberam apenas o dono (auth.uid() = polls.user_id), sem
-- abrir leitura de enquetes de terceiros.
-- =============================================================================

drop policy if exists polls_insert_own on public.polls;
create policy polls_insert_own on public.polls
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists polls_update_own on public.polls;
create policy polls_update_own on public.polls
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists polls_delete_own on public.polls;
create policy polls_delete_own on public.polls
  for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists poll_options_insert_own on public.poll_options;
create policy poll_options_insert_own on public.poll_options
  for insert to authenticated
  with check (
    exists (select 1 from public.polls p where p.id = poll_options.poll_id and p.user_id = auth.uid())
  );

drop policy if exists poll_options_update_own on public.poll_options;
create policy poll_options_update_own on public.poll_options
  for update to authenticated
  using (
    exists (select 1 from public.polls p where p.id = poll_options.poll_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.polls p where p.id = poll_options.poll_id and p.user_id = auth.uid())
  );

drop policy if exists poll_options_delete_own on public.poll_options;
create policy poll_options_delete_own on public.poll_options
  for delete to authenticated
  using (
    exists (select 1 from public.polls p where p.id = poll_options.poll_id and p.user_id = auth.uid())
  );

grant insert, update, delete on public.polls to authenticated;
grant insert, update, delete on public.poll_options to authenticated;