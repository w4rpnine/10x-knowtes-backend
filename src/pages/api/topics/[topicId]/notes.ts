import type { APIRoute } from "astro";
import { getNotesByTopicId } from "../../../../lib/services/notes.service";
import { supabaseClient } from "../../../../db/supabase.client";
import { getNotesQuerySchema, topicIdSchema } from "../../../../lib/schemas/notes.schema";
import { fromZodError } from "zod-validation-error";
import { createNoteSchema } from "../../../../lib/schemas/note.schema";
import { createNote } from "../../../../lib/services/notes.service";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
export const prerender = false;

/**
 * GET /api/topics/{topicId}/notes - Retrieves a list of notes for a specific topic
 *
 * Route parameters:
 * - topicId: UUID of the topic to retrieve notes for
 *
 * Query parameters:
 * - is_summary: Optional boolean to filter notes by summary status
 * - limit: Optional number of results to return (default: 50)
 * - offset: Optional offset for pagination (default: 0)
 *
 * Returns paginated list of notes that belong to the specified topic
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    // if (!locals.session?.user) {
    //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // const userId = locals.session.user.id;
    const userId = DEFAULT_USER_ID;

    // Validate topicId parameter
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

    // Parse query parameters from URL
    const url = new URL(request.url);
    const isSummaryParam = url.searchParams.get("is_summary");
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    // Prepare query params object
    const queryParams = {
      is_summary: isSummaryParam !== null ? isSummaryParam === "true" : undefined,
      limit: limitParam ? parseInt(limitParam) : undefined,
      offset: offsetParam ? parseInt(offsetParam) : undefined,
    };

    // Validate query parameters
    const queryValidation = getNotesQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe parametry zapytania",
          details: fromZodError(queryValidation.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if topic exists
    const { error: topicError } = await supabaseClient
      .from("topics")
      .select("id")
      .eq("id", topicId)
      .eq("user_id", userId)
      .single();

    if (topicError) {
      if (topicError.code === "PGRST116") {
        // "PGRST116" is the code for "no rows returned"
        return new Response(JSON.stringify({ error: "Temat nie został znaleziony" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw topicError;
    }

    // Get notes for the topic
    const notesResponse = await getNotesByTopicId(supabaseClient, userId, topicIdValidation.data, queryValidation.data);

    // Return notes
    return new Response(JSON.stringify(notesResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas pobierania notatek:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania żądania" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, params, locals }) => {
  // if (!locals.session?.user) {
  //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
  //     status: 401,
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }

  // const userId = locals.session.user.id;
  const userId = DEFAULT_USER_ID;
  const supabase = locals.supabase;
  const topicId = params.topicId;

  if (!topicId) {
    return new Response(JSON.stringify({ error: "Topic ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parsuj i waliduj dane wejściowe
    const requestData = await request.json();
    const validatedData = createNoteSchema.safeParse(requestData);

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validatedData.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Utworzenie notatki
    const note = await createNote(supabase, userId, topicId, validatedData.data);

    if (!note) {
      return new Response(JSON.stringify({ error: "Topic not found or access denied" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zwróć utworzoną notatkę
    return new Response(JSON.stringify(note), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error creating note:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
