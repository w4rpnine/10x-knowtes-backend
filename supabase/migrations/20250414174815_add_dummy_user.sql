INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-a000-000000000000',
  'dummy@example.com',
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;