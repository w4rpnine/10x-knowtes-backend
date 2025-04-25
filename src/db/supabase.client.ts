import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { AstroCookies } from "astro";

export type SupabaseClient = BaseSupabaseClient<Database>;

// Default user ID for development/testing
export const DEFAULT_USER_ID = "00000000-0000-4000-a000-000000000000";

// Cookie options for Supabase Auth
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

// Helper function to parse Cookie header
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

// Create server-side Supabase client with cookie handling
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  return createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });
};

// Initialize the Supabase client for client-side usage
export const supabaseClient = createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);
