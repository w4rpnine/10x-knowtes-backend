import type { APIRoute } from "astro";
import { getTopic, updateTopic, deleteTopic } from "../../../lib/services/topics.service";
import { updateTopicSchema } from "../../../lib/schemas/topic.schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

export const prerender = false;

// Define topic ID schema here since it's not exported from topic.schema.ts
const topicIdSchema = z.string().uuid("Topic ID must be a valid UUID");

// Common headers for all responses
const commonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * GET /api/topics/{id} - Retrieves a single topic by ID
 *
 * Route parameters:
 * - id: UUID of the topic to retrieve
 *
 * Returns topic if found and belongs to user
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.session.user.id;
    const supabase = locals.supabase;

    // Validate topic ID
    const { id: topicId } = params;
    if (!topicId) {
      return new Response(JSON.stringify({ error: "Topic ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationResult = topicIdSchema.safeParse(topicId);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid topic ID",
          details: fromZodError(validationResult.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get topic
    const topic = await getTopic(supabase, userId, validationResult.data);

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(topic), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching topic:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PUT /api/topics/{id} - Updates a topic
 *
 * Route parameters:
 * - id: UUID of the topic to update
 *
 * Request body:
 * - title: New title for the topic
 *
 * Returns updated topic
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.session.user.id;
    const supabase = locals.supabase;

    // Validate topic ID
    const { id: topicId } = params;
    if (!topicId) {
      return new Response(JSON.stringify({ error: "Topic ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationResult = topicIdSchema.safeParse(topicId);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid topic ID",
          details: fromZodError(validationResult.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validateResult = updateTopicSchema.safeParse(body);

    if (!validateResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: fromZodError(validateResult.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { title } = validateResult.data;

    // Update topic
    const updatedTopic = await updateTopic(supabase, userId, validationResult.data, { title });

    if (!updatedTopic) {
      return new Response(JSON.stringify({ error: "Topic not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedTopic), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating topic:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/topics/{id} - Deletes a topic
 *
 * Route parameters:
 * - id: UUID of the topic to delete
 *
 * Returns no content on success
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.session.user.id;
    const supabase = locals.supabase;

    // Validate topic ID
    const { id: topicId } = params;
    if (!topicId) {
      return new Response(JSON.stringify({ error: "Topic ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationResult = topicIdSchema.safeParse(topicId);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid topic ID",
          details: fromZodError(validationResult.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete topic
    const result = await deleteTopic(supabase, userId, validationResult.data);

    if (result === null) {
      return new Response(JSON.stringify({ error: "Topic not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting topic:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
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
