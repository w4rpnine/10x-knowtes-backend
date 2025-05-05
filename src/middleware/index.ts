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
    // Check for and decode the sb-auth cookie if present
    const cookieHeader = request.headers.get("Cookie") || "";
    const sbAuthMatch = cookieHeader.match(/sb-auth=base64-([^;]+)/);

    if (sbAuthMatch && sbAuthMatch[1]) {
      try {
        const base64Value = sbAuthMatch[1];
        const decodedValue = atob(base64Value);

        // Replace the encoded cookie with the decoded value
        const newCookieHeader = cookieHeader.replace(/sb-auth=base64-[^;]+/, `sb-auth=${decodedValue}`);

        // Create a new headers object with the updated cookie
        const newHeaders = new Headers(request.headers);
        newHeaders.set("Cookie", newCookieHeader);

        // Update the request headers
        Object.defineProperty(request, "headers", {
          value: newHeaders,
          writable: true,
        });
      } catch (error) {
        console.error("Failed to decode sb-auth cookie:", error);
      }
    }

    const supabase = createSupabaseServerInstance({
      cookies: cookies as AstroCookies,
      headers: request.headers,
    });
    let session = null;

    locals.supabase = supabase;

    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      session = {
        user: {
          id: data.user.id,
        },
      };
      context.locals.session = session;
    }
  }

  const result = await corsMiddleware(context, next);
  return result;
};
