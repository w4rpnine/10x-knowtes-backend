import type { APIRoute } from "astro";
import { NotesService } from "../../../lib/services/notes.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { z } from "zod";
import { noteIdSchema, updateNoteSchema } from "../../../lib/schemas/note.schema";

export const prerender = false;

// Validation schema for the note ID
const paramsSchema = z.object({
  id: z.string().uuid("Invalid note ID format"),
});

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS, PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

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

/**
 * PUT /notes/{id} - Update a specific note
 *
 * @description Updates an existing note with new title and/or content. The endpoint requires
 * authentication and verifies that the note belongs to the authenticated user. At least one
 * field (title or content) must be provided in the request body.
 *
 * @param {Object} params - Route parameters
 * @param {string} params.id - UUID of the note to update
 * @param {Object} request - Incoming request object
 * @param {Object} request.body - Request body containing update data
 * @param {string} [request.body.title] - Optional new title for the note (1-150 characters)
 * @param {string} [request.body.content] - Optional new content for the note (max 3000 characters)
 * @param {Object} locals - Astro locals object containing the Supabase client
 *
 * @throws {400} - When note ID is invalid or request body validation fails
 * @throws {404} - When note is not found or user doesn't have access
 * @throws {500} - When an unexpected error occurs
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - On success (200): Updated note data
 *   - On error: Error message and details
 *
 * @example
 * // Request body example:
 * {
 *   "title": "Updated Note Title",
 *   "content": "Updated note content..."
 * }
 *
 * // Success response example:
 * {
 *   "id": "123e4567-e89b-12d3-a456-426614174000",
 *   "title": "Updated Note Title",
 *   "content": "Updated note content...",
 *   "topic_id": "789e4567-e89b-12d3-a456-426614174000",
 *   "user_id": "456e4567-e89b-12d3-a456-426614174000",
 *   "is_summary": false,
 *   "created_at": "2024-03-20T12:00:00Z",
 *   "updated_at": "2024-03-20T12:30:00Z"
 * }
 */
export const PUT: APIRoute = async ({ params, locals, request }) => {
  // Handle OPTIONS request for CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Validate note ID
    const paramsResult = noteIdSchema.safeParse(params);
    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid note ID",
          details: paramsResult.error.format(),
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Parse and validate input data
    const requestData = await request.json();
    const bodyResult = updateNoteSchema.safeParse(requestData);

    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: bodyResult.error.format(),
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Update note using the service with DEFAULT_USER_ID
    const notesService = new NotesService(locals.supabase);
    const updatedNote = await notesService.updateNote(paramsResult.data.id, DEFAULT_USER_ID, bodyResult.data);

    if (!updatedNote) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(updatedNote), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
