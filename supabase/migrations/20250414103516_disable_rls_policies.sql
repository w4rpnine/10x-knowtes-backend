-- migration: 20250414103516_disable_rls_policies.sql
--
-- purpose: disable all row level security policies from previously defined tables
-- affected tables: users, topics, notes, summaries
--
-- author: automated migration
-- date: 2025-04-14

-- ============================================================================
-- disable policies for users table
-- ============================================================================
drop policy if exists "users_select_policy" on users;
drop policy if exists "users_insert_policy" on users;
drop policy if exists "users_update_policy" on users;
drop policy if exists "users_delete_policy" on users;

-- ============================================================================
-- disable policies for topics table
-- ============================================================================
drop policy if exists "topics_select_policy" on topics;
drop policy if exists "topics_insert_policy" on topics;
drop policy if exists "topics_update_policy" on topics;
drop policy if exists "topics_delete_policy" on topics;

-- ============================================================================
-- disable policies for notes table
-- ============================================================================
drop policy if exists "notes_select_policy" on notes;
drop policy if exists "notes_insert_policy" on notes;
drop policy if exists "notes_update_policy" on notes;
drop policy if exists "notes_delete_policy" on notes;

-- ============================================================================
-- disable policies for summaries table
-- ============================================================================
drop policy if exists "summaries_select_policy" on summaries;
drop policy if exists "summaries_insert_policy" on summaries;
drop policy if exists "summaries_update_policy" on summaries;
drop policy if exists "summaries_delete_policy" on summaries;

-- comment on migration purpose
comment on schema public is 'all rls policies have been disabled in migration 20250414103516';

-- note: row level security is still enabled on the tables, but with no policies
-- all data in these tables will be inaccessible until new policies are created
-- or until rls is disabled on the tables 