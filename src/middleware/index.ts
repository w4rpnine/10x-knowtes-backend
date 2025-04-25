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

export const onRequest: MiddlewareHandler = async ({ locals, cookies, url, request, redirect }, next) => {
  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  const supabase = createSupabaseServerInstance({
    cookies: cookies as AstroCookies,
    headers: request.headers,
  });

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.session = {
      user: {
        id: user.id,
        email: user.email,
      },
    };
    locals.supabase = supabase;
  } else if (!PUBLIC_PATHS.includes(url.pathname)) {
    // Redirect to login for protected routes
    return redirect("/auth/login");
  }

  return next();
};
