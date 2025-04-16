import { createClient } from "@supabase/supabase-js";
import { SupabaseClient as OriginalSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const DEFAULT_USER_ID = "00000000-0000-4000-a000-000000000000";

export type SupabaseClient = OriginalSupabaseClient<Database>;
