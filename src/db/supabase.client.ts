import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type SupabaseClient = BaseSupabaseClient<Database>;

// Default user ID for development/testing
export const DEFAULT_USER_ID = "00000000-0000-4000-a000-000000000000";

// Initialize the Supabase client
export const supabaseClient = createClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY
);
