import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

/**
 * Logout endpoint that handles user session termination
 *
 * @route POST /api/auth/logout
 * @returns {Object} 200 - Success response with confirmation message
 * @returns {Object} 401 - Unauthorized error when user is not authenticated
 * @returns {Object} 500 - Server error during logout process
 *
 * @example
 * // Success Response
 * {
 *   "message": "Successfully logged out"
 * }
 *
 * // Error Response
 * {
 *   "error": "Unauthorized"
 * }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check if user is authenticated first
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Perform logout
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return new Response(JSON.stringify({ error: "Server error during logout" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log successful logout
    console.info(`User ${user.id} successfully logged out at ${new Date().toISOString()}`);

    return new Response(JSON.stringify({ message: "Successfully logged out" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error during logout:", error);
    return new Response(JSON.stringify({ error: "Server error during logout" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
