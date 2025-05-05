import type { APIRoute } from "astro";
import { SummaryService } from "../../../../../lib/services/summary.service";
import { summaryTopicIdSchema } from "../../../../../lib/schemas/summary.schema";
import { handleAPIError } from "../../../../../lib/utils/error-handling";
export const POST: APIRoute = async (context) => {
  try {
    if (!context.locals.session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = context.locals.session.user.id;

    // Validate input parameters
    const { topicId } = summaryTopicIdSchema.parse(context.params);

    // Generate summary
    const summaryService = new SummaryService(context.locals.supabase);
    const result = await summaryService.generateSummary(userId, topicId);

    // Return response
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
