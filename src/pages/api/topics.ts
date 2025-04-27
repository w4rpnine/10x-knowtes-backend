import type { APIRoute } from "astro";
import { getTopics, createTopic } from "../../lib/services/topics.service";
import { supabaseClient } from "../../db/supabase.client";
import { createTopicSchema } from "../../lib/schemas/topic.schema";
import { fromZodError } from "zod-validation-error";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
export const prerender = false;

// Common headers for all responses
const commonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cookie, Authorization",
};

/**
 * GET /api/topics - Retrieves a list of topics
 *
 * Returns paginated list of topics for the default user
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // if (!locals.session?.user) {
    //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // const userId = locals.session.user.id;
    const userId = DEFAULT_USER_ID;

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get topics using Supabase client
    const supaclient = locals.supabase || supabaseClient;
    const topicsResponse = await getTopics(supaclient, userId, { limit, offset });

    return new Response(JSON.stringify(topicsResponse), {
      status: 200,
      headers: commonHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error " + error }), {
      status: 500,
      headers: commonHeaders,
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
    // if (!locals.session?.user) {
    //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // const userId = locals.session.user.id;
    const userId = DEFAULT_USER_ID;

    // Parse and validate request body
    const body = await request.json();
    const validateResult = createTopicSchema.safeParse(body);

    if (!validateResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: fromZodError(validateResult.error).message,
        }),
        { status: 400, headers: commonHeaders }
      );
    }

    // Create topic with the appropriate client
    const supaclient = locals.supabase || supabaseClient;
    const newTopic = await createTopic(supaclient, userId, validateResult.data);

    return new Response(JSON.stringify(newTopic), {
      status: 201,
      headers: commonHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error " + error }), {
      status: 500,
      headers: commonHeaders,
    });
  }
};

/**
 * OPTIONS - Handle CORS preflight requests
 */
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: commonHeaders,
  });
};
