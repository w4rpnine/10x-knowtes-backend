import { getTopics } from "../../../lib/services/topics.service";
import type { APIRoute } from "astro";
import { z } from "zod";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

const topicsQuerySchema = z.object({
  limit: z.coerce.number().positive().default(50),
  offset: z.coerce.number().nonnegative().default(0),
});

/**
 * GET /api/topics - Retrieve a paginated list of topics for the authenticated user
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get Supabase client from locals
    const { supabase } = locals;

    // Parse and validate query parameters
    const url = new URL(request.url);
    const result = topicsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: result.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Retrieve user's topics using the default user ID
    const topics = await getTopics(supabase, DEFAULT_USER_ID, result.data);

    // Return response
    return new Response(JSON.stringify(topics), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error fetching topics:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
