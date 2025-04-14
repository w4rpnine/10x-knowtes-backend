-- migration: 20250414113312_disable_rls.sql
-- description: completely disables row level security on all tables
-- author: system
-- tables: topics, notes, summary_stats
-- special considerations: this completely disables RLS enforcement, allowing public access to all tables

-- ============================================================
-- disable row level security enforcement on all tables
-- ============================================================

-- disable RLS on topics table
alter table topics disable row level security;

-- disable RLS on notes table
alter table notes disable row level security;

-- disable RLS on summary_stats table
alter table summary_stats disable row level security;

-- ============================================================
-- explanation: 
-- ============================================================
-- This migration completely disables row level security on all tables.
-- After applying this migration, all clients (authenticated or anonymous)
-- will have unrestricted access to these tables based on their database permissions.
-- 
-- This is useful for development or applications that handle security at a different layer,
-- but is generally not recommended for production environments with sensitive data.
-- 
-- To re-enable RLS in the future, you would need to:
-- 1. Enable RLS on tables
-- 2. Create appropriate policies
-- 
-- Example to re-enable:
-- ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "topic_policy_name" ON topics ... 