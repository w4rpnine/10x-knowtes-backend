import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName, type CookieOptions } from "@supabase/ssr";
import type { Database } from "../../db/database.types";

export const cookieOptions: CookieOptionsWithName = {
  name: "sb-auth",
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(
    process.env.SUPABASE_URL || import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_KEY || import.meta.env.SUPABASE_KEY || import.meta.env.PUBLIC_SUPABASE_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          const cookies = parseCookieHeader(context.headers.get("Cookie") ?? "");
          console.log(`getAll Cookies: ${cookies}`);
          return cookies;
        },
        setAll(cookiesToSet: CookieToSet[]) {
          console.log(`setAll Cookies: ${cookiesToSet}`);
          cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
        },
      },
    }
  );

  return supabase;
};
