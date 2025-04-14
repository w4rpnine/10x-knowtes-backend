import type { TopicDTO, PaginatedTopicsResponseDTO, CreateTopicCommand } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";

export interface TopicsQueryParams {
  limit?: number;
  offset?: number;
}

/**
 * Retrieves a paginated list of topics for a specific user
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user whose topics are being retrieved
 * @param params - Query parameters for pagination
 * @returns A paginated response containing topic data
 */
export async function getTopics(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: TopicsQueryParams
): Promise<PaginatedTopicsResponseDTO> {
  const { limit = 50, offset = 0 } = params;

  // Prepare query with user_id filtering
  let query = supabase.from("topics").select("*", { count: "exact" }).eq("user_id", userId);

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
  const topicDTOs: TopicDTO[] = data.map((topic: Database["public"]["Tables"]["topics"]["Row"]) => ({
    ...topic,
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
  supabase: SupabaseClient<Database>,
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
