import type { APIRoute } from "astro";
import { SummaryService } from "../../../../../../lib/services/summary.service";
import { handleAPIError, APIError } from "../../../../../../lib/utils/error-handling";
import { summaryAcceptParamsSchema, summaryContentSchema } from "../../../../../../lib/schemas/summary.schema";
import { DEFAULT_USER_ID } from "../../../../../../db/supabase.client";

export const prerender = false;

/**
 * PUT /topics/{topicId}/summaries/{summaryId}/accept
 *
 * Accepts a generated summary for a topic, marking it as accepted in the database.
 * Creates a new note with the summary content and sets is_summary=true.
 * Updates the summary_stats record with accepted=true and the new note ID.
 *
 * @param context - The Astro API context
 * @returns Response with summary_stat_id
 *
 * @throws {APIError} 400 - If validation fails or summary doesn't belong to topic
 * @throws {APIError} 401 - If user is not authenticated
 * @throws {APIError} 403 - If user doesn't have access to topic or summary
 * @throws {APIError} 404 - If topic or summary doesn't exist
 * @throws {APIError} 500 - If an error occurs during processing
 */
export const PUT: APIRoute = async (context) => {
  try {
    // For development purposes, we're using DEFAULT_USER_ID and skipping auth check
    // In production, uncomment the following:
    // requireAuth(context);
    // const userId = context.locals.session?.user.id;
    // if (!userId) {
    //   throw new APIError("User ID is required", 401);
    // }

    const userId = DEFAULT_USER_ID;

    // 1. Get and validate request body
    const body = await context.request.json().catch(() => {
      throw new APIError("Invalid JSON in request body", 400);
    });

    const summary = summaryContentSchema.parse(body);

    // 2. Validate URL parameters
    const params = summaryAcceptParamsSchema.parse({
      topicId: context.params.topicId,
      summaryId: context.params.summaryId,
    });

    // 3. Create service and accept summary
    const summaryService = new SummaryService(context.locals.supabase);
    const result = await summaryService.acceptSummary(userId, params.topicId, params.summaryId, summary);

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
