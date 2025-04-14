import type { APIRoute } from "astro";
import { createTopicSchema } from "../../lib/schemas/topic.schema";
import { createTopic, getTopics } from "../../lib/services/topics.service";
import { DEFAULT_USER_ID, supabaseClient } from "../../db/supabase.client";

export const prerender = false;

/**
 * GET /api/topics - Retrieves a list of topics
 *
 * Returns paginated list of topics for the default user
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Parse query parameters from URL
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    // Parse numeric parameters safely
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const offset = offsetParam ? parseInt(offsetParam) : undefined;

    // Get topics using the default user ID and supabaseClient
    const topicsResponse = await getTopics(supabaseClient, DEFAULT_USER_ID, { limit, offset });

    // Return topics
    return new Response(JSON.stringify(topicsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas pobierania tematów:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania żądania" }), {
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
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate input data
    const body = await request.json();
    const validateResult = createTopicSchema.safeParse(body);

    if (!validateResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: validateResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create topic using the default user ID and supabaseClient
    const newTopic = await createTopic(supabaseClient, DEFAULT_USER_ID, validateResult.data);

    // Return created topic
    return new Response(JSON.stringify(newTopic), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas tworzenia tematu:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania żądania" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
