import type { APIRoute } from "astro";
import { NotesService } from "../../../lib/services/notes.service";
import { fromZodError } from "zod-validation-error";
import { DEFAULT_USER_ID, supabaseClient } from "../../../db/supabase.client";
import { z } from "zod";
import { updateNoteSchema } from "../../../lib/schemas/note.schema";
export const prerender = false;

// Common headers for all responses
const commonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cookie, Authorization",
};

// Simple UUID validation schema
const uuidSchema = z.string().uuid("Invalid UUID format");

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
    // if (!locals.session?.user) {
    //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // const userId = locals.session?.user?.id || DEFAULT_USER_ID;
    const userId = DEFAULT_USER_ID;
    const supabase = locals.supabase || supabaseClient;

    // Validate note ID
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Note ID is required" }), {
        status: 400,
        headers: commonHeaders,
      });
    }

    // Use a simple string UUID validator instead of the object schema
    const result = uuidSchema.safeParse(params.id);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid note ID",
          details: fromZodError(result.error).message,
        }),
        { status: 400, headers: commonHeaders }
      );
    }

    // Get note using the service
    const notesService = new NotesService(supabase);
    const note = await notesService.getNoteById(params.id, userId);

    if (!note) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: commonHeaders,
      });
    }

    return new Response(JSON.stringify(note), {
      status: 200,
      headers: commonHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error " + error }), {
      status: 500,
      headers: commonHeaders,
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
    // if (!locals.session?.user) {
    //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // const userId = locals.session?.user?.id || DEFAULT_USER_ID;
    const userId = DEFAULT_USER_ID;
    const supabase = locals.supabase || supabaseClient;

    // Validate note ID
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Note ID is required" }), {
        status: 400,
        headers: commonHeaders,
      });
    }

    // Use a simple string UUID validator
    const paramsResult = uuidSchema.safeParse(params.id);

    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid note ID",
          details: fromZodError(paramsResult.error).message,
        }),
        { status: 400, headers: commonHeaders }
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
        { status: 400, headers: commonHeaders }
      );
    }

    // Update note using the service
    const notesService = new NotesService(supabase);
    const updatedNote = await notesService.updateNote(params.id, userId, bodyResult.data);

    if (!updatedNote) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: commonHeaders,
      });
    }

    return new Response(JSON.stringify(updatedNote), {
      status: 200,
      headers: commonHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error " + error }), {
      status: 500,
      headers: commonHeaders,
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
    // if (!locals.session?.user) {
    //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // const userId = locals.session?.user?.id || DEFAULT_USER_ID;
    const userId = DEFAULT_USER_ID;
    const supabase = locals.supabase || supabaseClient;

    // Validate note ID
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Note ID is required" }), {
        status: 400,
        headers: commonHeaders,
      });
    }

    // Use a simple string UUID validator
    const paramsResult = uuidSchema.safeParse(params.id);

    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid note ID",
          details: fromZodError(paramsResult.error).message,
        }),
        { status: 400, headers: commonHeaders }
      );
    }

    // Delete note using service
    const notesService = new NotesService(supabase);
    const result = await notesService.deleteNote(params.id, userId);

    if (result === false) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: commonHeaders,
      });
    }

    return new Response(null, { status: 204, headers: commonHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error " + error }), {
      status: 500,
      headers: commonHeaders,
    });
  }
};

/**
 * OPTIONS - Handle CORS preflight requests
 */
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: commonHeaders,
  });
};
