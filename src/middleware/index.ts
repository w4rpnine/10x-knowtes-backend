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
    console.log(`Middleware Request URL: ${url.pathname}`);

    // Log headers in readable format
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    console.log("Middleware Request Headers:", JSON.stringify(headersObj, null, 2));

    // Get cookie header and parse it manually
    const cookieHeader = request.headers.get("Cookie") || "";
    console.log("Middleware Cookie Header:", cookieHeader);

    // Parse cookies from header for better logging
    const parsedCookies = cookieHeader.split(";").map((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      return { name, value: valueParts.join("=") };
    });
    console.log("Parsed cookies:", JSON.stringify(parsedCookies, null, 2));

    const decodedValue = Buffer.from(parsedCookies[0].value, "base64").toString("utf-8");
    console.log(`Decoded cookie value: ${decodedValue}`);

    const supabase = createSupabaseServerInstance({
      cookies: cookies as AstroCookies,
      headers: request.headers,
    });
    console.log(`Middleware Supabase: ${supabase}`);

    locals.supabase = supabase;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log(`Middleware User: ${user}`);
  }

  const result = await corsMiddleware(context, next);
  return result;
};
