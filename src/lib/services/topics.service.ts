import type { TopicDTO, PaginatedTopicsResponseDTO, CreateTopicCommand } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";
import { updateTopicSchema } from "../schemas/topic.schema";

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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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
export async function getTopic(supabase: SupabaseClient, userId: string, topicId: string): Promise<TopicDTO> {
  if (!supabase) {
    throw new Error("Supabase client is not initialized");
  }

  const { data, error } = await supabase
    .from("topics")
    .select(
      `
      *,
      notes (*)
    `
    )
    .eq("id", topicId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("Topic not found");
    }
    throw error;
  }

  if (!data) {
    throw new Error("Topic not found");
  }

  return {
    ...data,
    notes: data.notes || [],
  };
}

/**
 * Updates an existing topic
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @param topicId - The ID of the topic to update
 * @param command - The command containing update data
 * @returns The updated topic as a DTO
 * @throws Error if topic not found, access denied, or update fails
 */
export async function updateTopic(
  supabase: SupabaseClient,
  userId: string,
  topicId: string,
  command: { title: string }
): Promise<TopicDTO> {
  // Validate the command
  const validatedData = await updateTopicSchema.parseAsync({ title: command.title });

  // Verify topic exists and user has access
  const { data: existingTopic, error: fetchError } = await supabase
    .from("topics")
    .select()
    .eq("id", topicId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingTopic) {
    throw new Error("Topic not found or access denied");
  }

  // Update the topic
  const { data: updatedTopic, error: updateError } = await supabase
    .from("topics")
    .update({
      title: validatedData.title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", topicId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError || !updatedTopic) {
    throw new Error("Failed to update topic");
  }

  return updatedTopic;
}

/**
 * Deletes a topic and all its related notes
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @param topicId - The ID of the topic to delete
 * @throws Error if topic not found, access denied, or deletion fails
 */
export async function deleteTopic(supabase: SupabaseClient, userId: string, topicId: string): Promise<void> {
  // Verify topic exists and user has access
  const { data: existingTopic, error: fetchError } = await supabase
    .from("topics")
    .select()
    .eq("id", topicId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingTopic) {
    throw new Error("Topic not found or access denied");
  }

  // Delete the topic (notes will be deleted via CASCADE)
  const { error: deleteError } = await supabase.from("topics").delete().eq("id", topicId).eq("user_id", userId);

  if (deleteError) {
    throw new Error("Failed to delete topic");
  }
}
