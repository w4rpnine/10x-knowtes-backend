-- migration: 20250414113311_disable_policies.sql
-- description: disables all previously created row level security policies
-- author: system
-- tables: topics, notes, summary_stats
-- special considerations: this is a destructive operation that removes all security policies from tables

-- ============================================================
-- disable topics table policies
-- ============================================================

-- drop policies for authenticated users
drop policy if exists topics_select_auth on topics;
drop policy if exists topics_insert_auth on topics;
drop policy if exists topics_update_auth on topics;
drop policy if exists topics_delete_auth on topics;

-- drop policies for anonymous users
drop policy if exists topics_select_anon on topics;
drop policy if exists topics_insert_anon on topics;
drop policy if exists topics_update_anon on topics;
drop policy if exists topics_delete_anon on topics;

-- ============================================================
-- disable notes table policies
-- ============================================================

-- drop policies for authenticated users
drop policy if exists notes_select_auth on notes;
drop policy if exists notes_insert_auth on notes;
drop policy if exists notes_update_auth on notes;
drop policy if exists notes_delete_auth on notes;

-- drop policies for anonymous users
drop policy if exists notes_select_anon on notes;
drop policy if exists notes_insert_anon on notes;
drop policy if exists notes_update_anon on notes;
drop policy if exists notes_delete_anon on notes;

-- ============================================================
-- disable summary_stats table policies
-- ============================================================

-- drop policies for authenticated users
drop policy if exists summary_stats_select_auth on summary_stats;
drop policy if exists summary_stats_insert_auth on summary_stats;
drop policy if exists summary_stats_update_auth on summary_stats;
drop policy if exists summary_stats_delete_auth on summary_stats;

-- drop policies for anonymous users
drop policy if exists summary_stats_select_anon on summary_stats;
drop policy if exists summary_stats_insert_anon on summary_stats;
drop policy if exists summary_stats_update_anon on summary_stats;
drop policy if exists summary_stats_delete_anon on summary_stats;

-- note: row level security remains enabled on all tables
-- this migration only removes the policies, not the enforcement of rls
-- tables will now deny all access unless new policies are created 