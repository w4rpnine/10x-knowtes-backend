import type { TopicDTO, PaginatedTopicsResponseDTO, CreateTopicCommand } from "../../types";
import { supabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";
import type { SupabaseClient } from '@supabase/supabase-js';

// Define a type for topic with notes from the database
type TopicWithNotes = Database["public"]["Tables"]["topics"]["Row"] & {
  notes: Database["public"]["Tables"]["notes"]["Row"][];
};

export interface TopicsQueryParams {
  limit?: number;
  offset?: number;
}

/**
 * Retrieves a paginated list of topics for a specific user. Topics contain all notes underneath them.
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user whose topics are being retrieved
 * @param params - Query parameters for pagination
 * @returns A paginated response containing topic data
 */
export async function getTopics(
  supabase: typeof supabaseClient,
  userId: string,
  params: TopicsQueryParams
): Promise<PaginatedTopicsResponseDTO> {
  const { limit = 50, offset = 0 } = params;

  // Prepare query with user_id filtering and include notes
  let query = supabase
    .from("topics")
    .select(
      `
      *,
      notes (*)
    `,
      { count: "exact" }
    )
    .eq("user_id", userId);

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
  const topicDTOs: TopicDTO[] = data.map((topic: TopicWithNotes) => ({
    ...topic,
    notes: topic.notes || [],
  }));

  return {
    data: topicDTOs,
    count: topicDTOs.length,
    total: count || 0,
  };
}

/**
 * Creates a new topic for a specific user
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user creating the topic
 * @param command - The command containing topic creation data
 * @returns The created topic as a DTO
 */
export async function createTopic(
  supabase: typeof supabaseClient,
  userId: string,
  command: CreateTopicCommand
): Promise<TopicDTO> {
  const { data, error } = await supabase
    .from("topics")
    .insert({
      title: command.title,
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Nie można utworzyć tematu: ${error.message}`);
  }

  return data;
}

/**
 * Retrieves a single topic with all its notes for a specific user
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @param topicId - The ID of the topic to retrieve
 * @returns The topic with all its notes as a DTO
 * @throws Error if topic not found or database error occurs
 */
export async function getTopic(
  supabase: SupabaseClient,
  userId: string,
  topicId: string
): Promise<TopicDTO> {
  const { data, error } = await supabase
    .from("topics")
    .select(`
      *,
      notes (*)
    `)
    .eq("id", topicId)
    .eq("user_id", userId)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("Topic not found");
    }
    throw error;
  }
  
  return {
    ...data,
    notes: data.notes || []
  };
}
