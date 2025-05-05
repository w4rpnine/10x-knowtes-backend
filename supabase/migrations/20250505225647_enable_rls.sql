-- migration: 20250505225647_enable_rls.sql
-- description: re-enables row level security and restores security policies
-- author: system
-- tables: topics, notes, summary_stats
-- special considerations: this restores security after it was disabled for development

-- ============================================================
-- enable row level security enforcement on all tables
-- ============================================================

-- enable RLS on topics table
alter table topics enable row level security;

-- enable RLS on notes table
alter table notes enable row level security;

-- enable RLS on summary_stats table
alter table summary_stats enable row level security;

-- ============================================================
-- restore row level security policies
-- ============================================================

-- topics table policies
-- select policy for authenticated users
create policy topics_select_auth on topics 
  for select 
  to authenticated
  using (auth.uid() = user_id);

-- select policy for anonymous users (deny access)
create policy topics_select_anon on topics 
  for select 
  to anon
  using (false);

-- insert policy for authenticated users
create policy topics_insert_auth on topics 
  for insert 
  to authenticated
  with check (auth.uid() = user_id);

-- insert policy for anonymous users (deny access)
create policy topics_insert_anon on topics 
  for insert 
  to anon
  with check (false);

-- update policy for authenticated users
create policy topics_update_auth on topics 
  for update 
  to authenticated
  using (auth.uid() = user_id);

-- update policy for anonymous users (deny access)
create policy topics_update_anon on topics 
  for update 
  to anon
  using (false);

-- delete policy for authenticated users
create policy topics_delete_auth on topics 
  for delete 
  to authenticated
  using (auth.uid() = user_id);

-- delete policy for anonymous users (deny access)
create policy topics_delete_anon on topics 
  for delete 
  to anon
  using (false);

-- notes table policies
-- select policy for authenticated users
create policy notes_select_auth on notes 
  for select 
  to authenticated
  using (auth.uid() = user_id);

-- select policy for anonymous users (deny access)
create policy notes_select_anon on notes 
  for select 
  to anon
  using (false);

-- insert policy for authenticated users
create policy notes_insert_auth on notes 
  for insert 
  to authenticated
  with check (auth.uid() = user_id);

-- insert policy for anonymous users (deny access)
create policy notes_insert_anon on notes 
  for insert 
  to anon
  with check (false);

-- update policy for authenticated users
create policy notes_update_auth on notes 
  for update 
  to authenticated
  using (auth.uid() = user_id);

-- update policy for anonymous users (deny access)
create policy notes_update_anon on notes 
  for update 
  to anon
  using (false);

-- delete policy for authenticated users
create policy notes_delete_auth on notes 
  for delete 
  to authenticated
  using (auth.uid() = user_id);

-- delete policy for anonymous users (deny access)
create policy notes_delete_anon on notes 
  for delete 
  to anon
  using (false);

-- summary_stats table policies
-- select policy for authenticated users
create policy summary_stats_select_auth on summary_stats 
  for select 
  to authenticated
  using (auth.uid() = user_id);

-- select policy for anonymous users (deny access)
create policy summary_stats_select_anon on summary_stats 
  for select 
  to anon
  using (false);

-- insert policy for authenticated users
create policy summary_stats_insert_auth on summary_stats 
  for insert 
  to authenticated
  with check (auth.uid() = user_id);

-- insert policy for anonymous users (deny access)
create policy summary_stats_insert_anon on summary_stats 
  for insert 
  to anon
  with check (false);

-- update policy for authenticated users
create policy summary_stats_update_auth on summary_stats 
  for update 
  to authenticated
  using (auth.uid() = user_id);

-- update policy for anonymous users (deny access)
create policy summary_stats_update_anon on summary_stats 
  for update 
  to anon
  using (false);

-- delete policy for authenticated users
create policy summary_stats_delete_auth on summary_stats 
  for delete 
  to authenticated
  using (auth.uid() = user_id);

-- delete policy for anonymous users (deny access)
create policy summary_stats_delete_anon on summary_stats 
  for delete 
  to anon
  using (false); 