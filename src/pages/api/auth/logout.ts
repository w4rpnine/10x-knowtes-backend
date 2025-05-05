import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

// Common headers for all responses
const commonHeaders = {
  "Content-Type": "application/json",
};

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
export const POST: APIRoute = async ({ locals }) => {
  try {
    if (!locals.session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: commonHeaders,
      });
    }

    // Perform logout
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(JSON.stringify({ error: "Server error during logout" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Successfully logged out" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error during logout " + error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
