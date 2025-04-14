import type { APIRoute } from "astro";
import { generateSummary } from "../../../../lib/services/summary.service";
import { topicIdSchema } from "../../../../lib/schemas/summary.schema";
import { fromZodError } from "zod-validation-error";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";

export const prerender = false;

/**
 * POST /api/topics/{topicId}/summary - Generate a summary (as a note) for a topic's notes using AI
 *
 * Route parameters:
 * - topicId: UUID of the topic to generate summary for
 *
 * This endpoint starts the asynchronous process of generating a summary:
 * 1. Creates a summary_stats record in the database
 * 2. Creates a new note with is_summary=true flag
 * 3. Returns information about the created resources immediately
 * 4. Actual summary generation happens asynchronously
 */
export const POST: APIRoute = async ({ params, locals }) => {
  try {
    // Pobierz klienta Supabase z kontekstu
    const supabase = locals.supabase;

    // Waliduj parametr topicId
    const { topicId } = params;

    if (!topicId) {
      return new Response(JSON.stringify({ error: "Brakujący identyfikator tematu" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const topicIdValidation = topicIdSchema.safeParse(topicId);

    if (!topicIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy identyfikator tematu",
          details: fromZodError(topicIdValidation.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Wygeneruj podsumowanie
    const summaryResponse = await generateSummary(
      supabase,
      DEFAULT_USER_ID, // Tymczasowo używamy domyślnego ID użytkownika
      topicIdValidation.data
    );

    // Jeśli nie znaleziono tematu lub użytkownik nie ma uprawnień
    if (!summaryResponse) {
      return new Response(JSON.stringify({ error: "Temat nie został znaleziony lub brak uprawnień" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zwróć informacje o rozpoczętym procesie generowania
    return new Response(JSON.stringify(summaryResponse), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas generowania podsumowania:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania żądania" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
