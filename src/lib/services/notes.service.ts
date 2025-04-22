import type { NoteDTO, PaginatedNotesResponseDTO, CreateNoteCommand } from "../../types";
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

/**
 * Tworzy nową notatkę w ramach określonego tematu.
 *
 * @param supabase Klient Supabase
 * @param userId ID zalogowanego użytkownika
 * @param topicId ID tematu, w którym ma być utworzona notatka
 * @param data Dane notatki
 * @returns Utworzona notatka lub null jeśli temat nie istnieje lub użytkownik nie ma do niego dostępu
 */
export async function createNote(
  supabase: SupabaseClient<Database>,
  userId: string,
  topicId: string,
  data: CreateNoteCommand
): Promise<NoteDTO | null> {
  // Sprawdź czy temat istnieje i należy do użytkownika
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id")
    .eq("id", topicId)
    .eq("user_id", userId)
    .single();

  if (topicError || !topic) {
    return null;
  }

  // Utwórz nową notatkę
  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      topic_id: topicId,
      user_id: userId,
      title: data.title,
      content: data.content,
      is_summary: data.is_summary ?? false,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return note;
}

export class NotesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getNoteById(noteId: string, userId: string): Promise<NoteDTO | null> {
    // Early validation of inputs
    if (!noteId || !userId) {
      throw new Error("Note ID and User ID are required");
    }

    // Query the database with user authorization check
    const { data, error } = await this.supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .eq("user_id", userId)
      .single();

    // Handle database errors
    if (error) {
      if (error.code === "PGRST116") {
        return null; // Note not found
      }
      throw error;
    }

    return data as NoteDTO;
  }
}
