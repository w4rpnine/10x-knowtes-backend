-- migration: 20250414112806_initial_schema.sql
-- description: creates the initial schema for the 10x-knowtes application
-- author: system
-- tables: topics, notes, summary_stats
-- special considerations: this migration sets up the base schema with RLS policies and triggers

-- ============================================================
-- topics table: stores user topic information 
-- ============================================================
create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title varchar(150) not null check (length(title) > 0 and length(title) <= 150),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on topics
alter table topics enable row level security;

-- create indexes for topics
create index idx_topics_user_id on topics(user_id);

-- ============================================================
-- notes table: stores notes associated with topics
-- ============================================================
create table notes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title varchar(150) not null check (length(title) <= 150),
  content text not null check (length(content) <= 3000),
  is_summary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on notes
alter table notes enable row level security;

-- create indexes for notes
create index idx_notes_user_id on notes(user_id);
create index idx_notes_topic_id on notes(topic_id);
create index idx_notes_is_summary on notes(is_summary);
create index idx_notes_created_at on notes(created_at);
create index idx_notes_topic_is_summary on notes(topic_id, is_summary);

-- ============================================================
-- summary_stats table: tracks statistics about summaries
-- ============================================================
create table summary_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  summary_note_id uuid references notes(id) on delete set null,
  generated_at timestamptz not null default now(),
  accepted boolean not null default false
);

-- enable row level security on summary_stats
alter table summary_stats enable row level security;

-- create indexes for summary_stats
create index idx_summary_stats_user_id on summary_stats(user_id);
create index idx_summary_stats_topic_id on summary_stats(topic_id);
create index idx_summary_stats_summary_note_id on summary_stats(summary_note_id);
create index idx_summary_stats_accepted on summary_stats(accepted);

-- ============================================================
-- functions and triggers
-- ============================================================

-- function to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- trigger for topics table
create trigger update_topics_updated_at
before update on topics
for each row
execute function update_updated_at();

-- trigger for notes table
create trigger update_notes_updated_at
before update on notes
for each row
execute function update_updated_at();

-- ============================================================
-- row level security policies
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