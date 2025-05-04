import type { MiddlewareHandler } from "astro";
import type { AstroCookies } from "astro";
import { createSupabaseServerInstance } from "../lib/services/supabase.server";
import { corsMiddleware } from "./cors";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
];

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { locals, cookies, url, request } = context;

  // Initialize Supabase client if not a public path
  if (!PUBLIC_PATHS.includes(url.pathname)) {
    console.log(`Middleware Request URL: ${request.body}`);
    console.log(`Middleware Request Headers: ${request.headers}`);
    console.log(`Middleware Request Cookies: ${cookies}`);
    console.log(`Middleware Request Astro Cookies: ${cookies as AstroCookies}`);
    const supabase = createSupabaseServerInstance({
      cookies: cookies as AstroCookies,
      headers: request.headers,
    });
    console.log(`Middleware Supabase: ${supabase}`);

    locals.supabase = supabase;
  }

  const result = await corsMiddleware(context, next);
  return result;
};
