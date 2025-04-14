-- migration: 20250414102628_initial_schema.sql
--
-- purpose: create initial database schema for 10x-knowtes application
-- tables: users, topics, notes, summaries
-- relationships: user → topics, user → notes, topic → notes, topic → topics (hierarchical), topic → summaries
-- security: row level security (rls) policies for all tables
--
-- author: automated migration
-- date: 2025-04-14

-- enable uuid extension if not already enabled
create extension if not exists "uuid-ossp";

-- ============================================================================
-- users table
-- ============================================================================
create table users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    encrypted_password text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- enable row level security
alter table users enable row level security;

-- create rls policies for users table
-- select policy for authenticated users
comment on table users is 'stores user account information';
create policy "users_select_policy" 
    on users for select 
    to authenticated 
    using (id = auth.uid());

-- insert policy for authenticated users
create policy "users_insert_policy" 
    on users for insert 
    to authenticated 
    with check (id = auth.uid());

-- update policy for authenticated users
create policy "users_update_policy" 
    on users for update 
    to authenticated 
    using (id = auth.uid());

-- delete policy for authenticated users
create policy "users_delete_policy" 
    on users for delete 
    to authenticated 
    using (id = auth.uid());

-- ============================================================================
-- topics table - hierarchical structure for organizing notes
-- ============================================================================
create table topics (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    parent_id uuid references topics(id) on delete cascade,
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- enable row level security
alter table topics enable row level security;

-- create indexes for better query performance
create index topics_user_id_idx on topics(user_id);
create index topics_parent_id_idx on topics(parent_id);

-- create rls policies for topics table
comment on table topics is 'stores topic hierarchies for organizing notes';
-- select policy for authenticated users
create policy "topics_select_policy" 
    on topics for select 
    to authenticated 
    using (user_id = auth.uid());

-- insert policy for authenticated users
create policy "topics_insert_policy" 
    on topics for insert 
    to authenticated 
    with check (user_id = auth.uid());

-- update policy for authenticated users
create policy "topics_update_policy" 
    on topics for update 
    to authenticated 
    using (user_id = auth.uid());

-- delete policy for authenticated users
create policy "topics_delete_policy" 
    on topics for delete 
    to authenticated 
    using (user_id = auth.uid());

-- ============================================================================
-- notes table
-- ============================================================================
create table notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    topic_id uuid not null references topics(id) on delete cascade,
    title text not null,
    content text not null check (length(content) <= 3000),
    character_count integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- enable row level security
alter table notes enable row level security;

-- create indexes for better query performance
create index notes_user_id_idx on notes(user_id);
create index notes_topic_id_idx on notes(topic_id);
create index notes_content_gin_idx on notes using gin (to_tsvector('english', content));

-- create rls policies for notes table
comment on table notes is 'stores user notes with content limited to 3000 characters';
-- select policy for authenticated users
create policy "notes_select_policy" 
    on notes for select 
    to authenticated 
    using (user_id = auth.uid());

-- insert policy for authenticated users
create policy "notes_insert_policy" 
    on notes for insert 
    to authenticated 
    with check (user_id = auth.uid());

-- update policy for authenticated users
create policy "notes_update_policy" 
    on notes for update 
    to authenticated 
    using (user_id = auth.uid());

-- delete policy for authenticated users
create policy "notes_delete_policy" 
    on notes for delete 
    to authenticated 
    using (user_id = auth.uid());

-- ============================================================================
-- summaries table
-- ============================================================================
create table summaries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    topic_id uuid not null references topics(id) on delete cascade,
    title text not null,
    content text not null check (length(content) <= 3000),
    character_count integer not null,
    created_at timestamptz not null default now()
);

-- enable row level security
alter table summaries enable row level security;

-- create indexes for better query performance
create index summaries_user_id_idx on summaries(user_id);
create index summaries_topic_id_idx on summaries(topic_id);

-- create rls policies for summaries table
comment on table summaries is 'stores generated summaries for topics';
-- select policy for authenticated users
create policy "summaries_select_policy" 
    on summaries for select 
    to authenticated 
    using (user_id = auth.uid());

-- insert policy for authenticated users
create policy "summaries_insert_policy" 
    on summaries for insert 
    to authenticated 
    with check (user_id = auth.uid());

-- update policy for authenticated users
create policy "summaries_update_policy" 
    on summaries for update 
    to authenticated 
    using (user_id = auth.uid());

-- delete policy for authenticated users
create policy "summaries_delete_policy" 
    on summaries for delete 
    to authenticated 
    using (user_id = auth.uid());

-- ============================================================================
-- functions and triggers
-- ============================================================================

-- function to automatically update character count on notes and summaries
create or replace function update_character_count()
returns trigger as $$
begin
    new.character_count = length(new.content);
    return new;
end;
$$ language plpgsql;

-- trigger for notes character count
create trigger notes_character_count_trigger
before insert or update on notes
for each row
execute function update_character_count();

-- trigger for summaries character count
create trigger summaries_character_count_trigger
before insert or update on summaries
for each row
execute function update_character_count();

-- ============================================================================
-- views
-- ============================================================================

-- view to get note count per topic
create or replace view notes_per_topic as
select 
    topics.id as topic_id,
    topics.name as topic_name,
    topics.user_id,
    count(notes.id) as note_count
from 
    topics
left join 
    notes on topics.id = notes.topic_id
group by 
    topics.id;

-- ============================================================================
-- security: grant permissions to auth roles
-- ============================================================================

-- grant permissions for authenticated users
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- grant limited permissions for anonymous users
grant usage on schema public to anon; 