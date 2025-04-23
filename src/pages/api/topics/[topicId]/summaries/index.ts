import type { APIRoute } from "astro";
import { SummaryService } from "../../../../../lib/services/summary.service";
import { summaryTopicIdSchema } from "../../../../../lib/schemas/summary.schema";
import { handleAPIError } from "../../../../../lib/utils/error-handling";
import { DEFAULT_USER_ID } from "../../../../../db/supabase.client";

export const POST: APIRoute = async (context) => {
  try {
    // 1. Use DEFAULT_USER_ID for development/testing
    const userId = DEFAULT_USER_ID;

    // 2. Validate input parameters
    const { topicId } = summaryTopicIdSchema.parse(context.params);

    // 3. Generate summary
    const summaryService = new SummaryService(context.locals.supabase);
    const result = await summaryService.generateSummary(userId, topicId);

    // 4. Return response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
