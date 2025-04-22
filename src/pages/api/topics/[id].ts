import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import { z } from "zod";
import { getTopic, updateTopic, deleteTopic } from "../../../lib/services/topics.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { updateTopicSchema } from "../../../lib/schemas/topic.schema";
import { uuidSchema } from "../../../lib/schemas/topic.schema";

export const prerender = false;

const topicIdSchema = z.string().uuid("Topic ID must be a valid UUID");

// Common headers for all responses
const commonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase } = locals as {
      supabase: SupabaseClient<Database>;
    };

    // Validate topic ID parameter
    const topicId = params.id;
    if (!topicId) {
      return new Response(JSON.stringify({ error: "Topic ID is required" }), { status: 400, headers: commonHeaders });
    }

    const parseResult = topicIdSchema.safeParse(topicId);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid topic ID format",
          details: parseResult.error.format(),
        }),
        { status: 400, headers: commonHeaders }
      );
    }

    try {
      const topic = await getTopic(supabase, DEFAULT_USER_ID, topicId);

      return new Response(JSON.stringify(topic), { status: 200, headers: commonHeaders });
    } catch (error) {
      if (error instanceof Error && error.message === "Topic not found") {
        return new Response(JSON.stringify({ error: "Topic not found" }), { status: 404, headers: commonHeaders });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error fetching topic:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: commonHeaders });
  }
};

/**
 * Updates an existing topic
 *
 * @route PUT /topics/{id}
 * @param {string} id - Topic UUID
 * @body {object} requestBody - Topic update data
 * @body {string} requestBody.title - New topic title (1-150 characters)
 *
 * @returns {object} 200 - Updated topic object
 * @returns {object} 400 - Validation error
 * @returns {object} 401 - Unauthorized
 * @returns {object} 403 - Forbidden
 * @returns {object} 404 - Topic not found
 * @returns {object} 500 - Internal server error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Validate topic ID
    const topicId = await uuidSchema.parseAsync(params.id);

    // Get supabase client from locals
    const { supabase } = locals as {
      supabase: SupabaseClient<Database>;
    };

    // Parse and validate request body
    const body = await request.json();
    const { title } = (await updateTopicSchema.parseAsync(body)) as { title: string };

    // Update topic using the validated data
    const updatedTopic = await updateTopic(supabase, DEFAULT_USER_ID, topicId, { title });

    return new Response(JSON.stringify(updatedTopic), {
      status: 200,
      headers: commonHeaders,
    });
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message.includes("not found") ? 404 : error.message.includes("access denied") ? 403 : 400;

      return new Response(JSON.stringify({ error: error.message }), {
        status,
        headers: commonHeaders,
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: commonHeaders,
    });
  }
};

/**
 * Deletes a topic and all related notes
 *
 * @route DELETE /topics/{id}
 * @param {string} id - Topic UUID
 *
 * @returns {object} 204 - No Content on successful deletion
 * @returns {object} 400 - Invalid UUID format
 * @returns {object} 401 - Unauthorized
 * @returns {object} 403 - Forbidden
 * @returns {object} 404 - Topic not found
 * @returns {object} 500 - Internal server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    console.log(`[${requestId}] DELETE /topics/${params.id} - Request started`);

    // Validate topic ID
    const topicId = await topicIdSchema.parseAsync(params.id);
    console.log(`[${requestId}] Topic ID validation passed: ${topicId}`);

    // Get supabase client from locals
    const { supabase } = locals as {
      supabase: SupabaseClient<Database>;
    };

    // Delete topic
    await deleteTopic(
      supabase,
      DEFAULT_USER_ID, // In future, this should be replaced with authenticated user ID
      topicId
    );

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Topic deleted successfully. Duration: ${duration}ms`);

    // Return 204 No Content for successful deletion
    return new Response(null, {
      status: 204,
      headers: commonHeaders,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof Error) {
      const status = error.message.includes("not found")
        ? 404
        : error.message.includes("access denied")
          ? 403
          : error.message.includes("Invalid")
            ? 400
            : 500;

      console.error(
        `[${requestId}] Error deleting topic: ${error.message}. Status: ${status}. Duration: ${duration}ms`,
        {
          error,
          params,
          duration,
        }
      );

      return new Response(JSON.stringify({ error: error.message }), {
        status,
        headers: commonHeaders,
      });
    }

    console.error(`[${requestId}] Unexpected error deleting topic. Duration: ${duration}ms`, {
      error,
      params,
      duration,
    });

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: commonHeaders,
    });
  }
};

// Handle OPTIONS requests for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: commonHeaders,
  });
};
