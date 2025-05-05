-- migration: 20250505230251_remove_dummy_user.sql
-- description: removes the dummy user created for development
-- author: system
-- tables: auth.users
-- special considerations: this removes the dummy user with ID 00000000-0000-4000-a000-000000000000

-- ============================================================
-- remove dummy user
-- ============================================================

DELETE FROM auth.users
WHERE id = '00000000-0000-4000-a000-000000000000'; 