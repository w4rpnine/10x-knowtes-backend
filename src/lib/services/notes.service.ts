import type { NoteDTO, PaginatedNotesResponseDTO } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";

export interface NotesQueryParams {
  is_summary?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Retrieves a paginated list of notes for a specific topic
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user whose notes are being retrieved
 * @param topicId - The ID of the topic to retrieve notes for
 * @param params - Query parameters for filtering and pagination
 * @returns A paginated response containing note data
 */
export async function getNotesByTopicId(
  supabase: SupabaseClient<Database>,
  userId: string,
  topicId: string,
  params: NotesQueryParams
): Promise<PaginatedNotesResponseDTO> {
  const { is_summary, limit = 50, offset = 0 } = params;

  // Prepare query with user_id and topic_id filtering
  let query = supabase.from("notes").select("*", { count: "exact" }).eq("user_id", userId).eq("topic_id", topicId);

  // Apply is_summary filter if provided
  if (typeof is_summary === "boolean") {
    query = query.eq("is_summary", is_summary);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  // Sort by creation date (newest first)
  query = query.order("created_at", { ascending: false });

  // Execute the query
  const { data, count, error } = await query;

  if (error) {
    throw error;
  }

  // Map database entities to DTOs
  const noteDTOs: NoteDTO[] = data.map((note: Database["public"]["Tables"]["notes"]["Row"]) => ({
    ...note,
  }));

  return {
    data: noteDTOs,
    count: noteDTOs.length,
    total: count || 0,
  };
}
