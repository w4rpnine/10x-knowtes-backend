import type { APIRoute } from "astro";
import { getTopics, createTopic } from "../../lib/services/topics.service";
import { supabaseClient } from "../../db/supabase.client";
import { createTopicSchema } from "../../lib/schemas/topic.schema";
import { fromZodError } from "zod-validation-error";

export const prerender = false;

/**
 * GET /api/topics - Retrieves a list of topics
 *
 * Returns paginated list of topics for the default user
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.session.user.id;

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get topics
    const topicsResponse = await getTopics(supabaseClient, userId, { limit, offset });

    return new Response(JSON.stringify(topicsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching topics:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/topics - Creates a new topic
 *
 * No authentication required, using default user ID
 * Validates request body against schema
 * Creates topic in database and returns it
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validateResult = createTopicSchema.safeParse(body);

    if (!validateResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: fromZodError(validateResult.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create topic
    const newTopic = await createTopic(supabaseClient, userId, validateResult.data);

    return new Response(JSON.stringify(newTopic), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating topic:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
