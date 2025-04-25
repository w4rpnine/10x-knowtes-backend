/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";
import type { UserProfile } from "./lib/types";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      session: {
        user: UserProfile;
      } | null;
      request: Request;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SITE: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
