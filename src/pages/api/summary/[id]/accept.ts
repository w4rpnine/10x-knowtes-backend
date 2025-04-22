import { z } from "zod";
import { acceptSummary } from "../../../../lib/services/summary.service";
import type { APIContext } from "astro";
import type { AcceptSummaryCommand } from "../../../../types";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";

export const prerender = false;

// Validation schema for ID parameter
const paramsSchema = z.object({
  id: z.string().uuid("Summary ID must be a valid UUID"),
});

// Validation schema for empty request body
const bodySchema = z.object({}).strict();

/**
 * Accepts a generated summary.
 *
 * @endpoint PUT /api/summary/{id}/accept
 * @param {APIContext} context - The Astro API context
 * @param {Object} context.locals - Local variables including session and Supabase client
 * @param {Object} context.params - URL parameters
 * @param {Object} context.request - HTTP request object
 * @returns {Promise<Response>} HTTP response with the accepted summary or error details
 *
 * @example
 * curl -X PUT 'http://localhost:3001/api/summary/123e4567-e89b-12d3-a456-426614174000/accept' \
 *   -H 'Content-Type: application/json'
 *
 * @throws {Response} 401 - If user is not authenticated
 * @throws {Response} 400 - If summary ID format is invalid or request body is not empty
 * @throws {Response} 404 - If summary is not found or user has no access
 * @throws {Response} 500 - If server error occurs
 */
export async function PUT({ locals, params, request }: APIContext) {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "PUT",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // For development/testing, use DEFAULT_USER_ID
  const userId = DEFAULT_USER_ID;

  // Validate URL parameters
  const paramsResult = paramsSchema.safeParse(params);
  if (!paramsResult.success) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Invalid summary ID format",
        details: paramsResult.error.format(),
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // Validate request body (should be empty)
  try {
    const body: AcceptSummaryCommand = await request.json();
    const bodyResult = bodySchema.safeParse(body);
    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Request body should be empty",
          details: bodyResult.error.format(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  } catch {
    // Empty body or invalid JSON are acceptable since we expect an empty body
  }

  // Get summary ID
  const { id: summaryId } = paramsResult.data;

  try {
    // Call service function to accept the summary
    const summary = await acceptSummary(locals.supabase, userId, summaryId);

    // If summary not found or doesn't belong to user
    if (!summary) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Summary not found or access denied",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Return updated summary
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error accepting summary:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while accepting the summary",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
