import { z } from "zod";
import type { APIRoute } from "astro";
import { rejectSummary } from "../../../../lib/services/summary.service";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";

/**
 * Endpoint for rejecting a generated summary.
 *
 * @endpoint PUT /api/summary/{id}/reject
 *
 * @param {Object} params - URL parameters
 * @param {string} params.id - UUID of the summary to reject
 *
 * @returns {Object} The updated summary stat record
 * @throws {400} Invalid summary ID format or non-empty request body
 * @throws {401} User not authenticated
 * @throws {404} Summary not found or access denied
 * @throws {500} Internal server error
 *
 * @example
 * curl -X PUT 'http://localhost:3001/api/summary/123e4567-e89b-12d3-a456-426614174000/reject' \
 *   -H 'Content-Type: application/json'
 */

// Schema for validating UUID parameter
const paramsSchema = z.object({
  id: z.string().uuid("Invalid summary ID format"),
});

// Schema for validating empty request body
const bodySchema = z.object({}).strict();

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // For now, using DEFAULT_USER_ID instead of session user
    const userId = DEFAULT_USER_ID;

    // Validate URL parameters
    const validatedParams = paramsSchema.safeParse(params);
    if (!validatedParams.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid parameters",
          details: validatedParams.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request body if content is present
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 0) {
      const body = await request.json();
      const validatedBody = bodySchema.safeParse(body);
      if (!validatedBody.success) {
        return new Response(
          JSON.stringify({
            error: "Invalid request body",
            details: validatedBody.error.errors,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Call service function to reject summary
    const result = await rejectSummary(locals.supabase, userId, validatedParams.data.id);

    if (!result) {
      return new Response(JSON.stringify({ error: "Summary not found or not accessible" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error rejecting summary:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
