import type { APIRoute } from "astro";
import { NotesService } from "../../../lib/services/notes.service";
import { noteIdSchema, updateNoteSchema } from "../../../lib/schemas/note.schema";
import { fromZodError } from "zod-validation-error";

export const prerender = false;

/**
 * GET /api/notes/{id} - Retrieves a single note by ID
 *
 * Route parameters:
 * - id: UUID of the note to retrieve
 *
 * Returns note if found and belongs to user
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

    // Validate note ID
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Note ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = noteIdSchema.safeParse(params.id);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid note ID",
          details: fromZodError(result.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get note using the service
    const notesService = new NotesService(supabase);
    const note = await notesService.getNoteById(params.id, userId);

    if (!note) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(note), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching note:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PUT /api/notes/{id} - Updates a note
 *
 * Route parameters:
 * - id: UUID of the note to update
 *
 * Request body:
 * - title: Optional new title for the note
 * - content: Optional new content for the note
 *
 * Returns updated note
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

    // Validate note ID
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Note ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const paramsResult = noteIdSchema.safeParse(params.id);
    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid note ID",
          details: fromZodError(paramsResult.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const bodyResult = updateNoteSchema.safeParse(body);

    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: fromZodError(bodyResult.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update note using the service
    const notesService = new NotesService(supabase);
    const updatedNote = await notesService.updateNote(params.id, userId, bodyResult.data);

    if (!updatedNote) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedNote), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating note:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/notes/{id} - Deletes a note
 *
 * Route parameters:
 * - id: UUID of the note to delete
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

    // Validate note ID
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Note ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const paramsResult = noteIdSchema.safeParse(params.id);
    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid note ID",
          details: fromZodError(paramsResult.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete note using service
    const notesService = new NotesService(supabase);
    const result = await notesService.deleteNote(params.id, userId);

    if (result === false) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting note:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
