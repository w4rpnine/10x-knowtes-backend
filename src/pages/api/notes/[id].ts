import type { APIRoute } from "astro";
import { NotesService } from "../../../lib/services/notes.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { z } from "zod";

export const prerender = false;

// Validation schema for the note ID
const paramsSchema = z.object({
  id: z.string().uuid("Invalid note ID format"),
});

/**
 * GET /notes/{id} - Retrieve a specific note by ID
 *
 * @description Fetches detailed information about a single note.
 *
 * @param {Object} params.id - UUID of the note to retrieve
 * @throws {400} - When note ID is invalid
 * @throws {404} - When note is not found
 * @returns {Promise<Response>} Note data or error response
 */
export const GET: APIRoute = async ({ params, locals, request }) => {
  // Common headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS request for CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Validate note ID
    const result = paramsSchema.safeParse(params);
    if (!result.success) {
      return new Response(JSON.stringify({ error: "Invalid note ID" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get note using the service with DEFAULT_USER_ID
    const notesService = new NotesService(locals.supabase);
    const note = await notesService.getNoteById(result.data.id, DEFAULT_USER_ID);

    if (!note) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(note), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
