import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";
import type { SupabaseClient } from "../db/supabase.client";

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = async () => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key must be defined in environment variables");
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
};
