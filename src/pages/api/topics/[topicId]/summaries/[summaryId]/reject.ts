import type { APIRoute } from "astro";
import { SummaryService } from "../../../../../../lib/services/summary.service";
import { APIError, handleAPIError } from "../../../../../../lib/utils/error-handling";
import { summaryRejectParamsSchema } from "../../../../../../lib/schemas/summary.schema";
export const prerender = false;

/**
 * PUT /topics/{topicId}/summaries/{summaryId}/reject
 *
 * Rejects a generated summary for a topic, removing it from the database.
 * This endpoint allows users to indicate that they don't want to use a particular summary,
 * which removes the summary from consideration without creating a note from it.
 *
 * Authorization:
 * - Requires authentication
 * - User must own the topic and summary
 *
 * Path Parameters:
 * - topicId: UUID - The identifier of the topic
 * - summaryId: UUID - The identifier of the summary to reject
 *
 * Request Body:
 * - Empty (uses RejectSummaryCommand type which is a Record<string, never>)
 *
 * Responses:
 * - 204 No Content: Summary was successfully rejected
 * - 400 Bad Request: Invalid parameters or summary doesn't belong to topic
 * - 401 Unauthorized: User is not authenticated
 * - 403 Forbidden: User doesn't have access to topic or summary
 * - 404 Not Found: Topic or summary doesn't exist
 * - 500 Internal Server Error: Server-side error during processing
 *
 * @param context - The Astro API context
 * @returns Response with no content (204)
 */
export const PUT: APIRoute = async (context) => {
  try {
    if (!context.locals.session?.user) {
      throw new APIError("Unauthorized", 401);
    }

    const userId = context.locals.session.user.id;

    // Validate URL parameters
    const params = summaryRejectParamsSchema.parse({
      topicId: context.params.topicId,
      summaryId: context.params.summaryId,
    });

    // Create service and reject summary
    const summaryService = new SummaryService(context.locals.supabase);
    await summaryService.rejectSummary(userId, params.topicId, params.summaryId);

    // Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
