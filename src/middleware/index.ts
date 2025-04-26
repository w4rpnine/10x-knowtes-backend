import type { MiddlewareHandler } from "astro";
import type { AstroCookies } from "astro";
import { createSupabaseServerInstance } from "../lib/services/supabase.server";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
];

export const onRequest: MiddlewareHandler = async ({ locals, cookies, url, request }, next) => {
  // Initialize Supabase client if not a public path
  if (!PUBLIC_PATHS.includes(url.pathname)) {
    const supabase = createSupabaseServerInstance({
      cookies: cookies as AstroCookies,
      headers: request.headers,
    });

    locals.supabase = supabase;
  }

  // Get the response from the endpoint
  const response = await next();

  // Add CORS headers to all responses
  response.headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Cookie, Authorization");

  // Handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
};
