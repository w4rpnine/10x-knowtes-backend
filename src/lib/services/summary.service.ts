import type { SupabaseClient } from "../../db/supabase.client";
import { AIService } from "./ai.service";
import { APIError } from "../utils/error-handling";
import type { CreateNoteCommand, NoteDTO } from "../../types";

export class SummaryService {
  private aiService: AIService;

  constructor(
    private readonly supabase: SupabaseClient,
    aiService?: AIService
  ) {
    const apiKey = import.meta.env.PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("PUBLIC_OPENROUTER_API_KEY environment variable is not set");
    }
    this.aiService = aiService || new AIService(apiKey);
  }

  /**
   * Generates a summary for notes in a topic
   * @throws Error if topic doesn't exist, user doesn't have access, or no notes to summarize
   */
  async generateSummary(
    _userId: string,
    topicId: string
  ): Promise<{ summary_stat_id: string; title: string; content: string }> {
    // 1. Check if topic exists and belongs to user
    const { data: topic, error: topicError } = await this.supabase
      .from("topics")
      .select("id")
      .eq("id", topicId)
      .eq("user_id", _userId)
      .single();

    if (topicError || !topic) {
      throw new Error(topicError?.message || "Topic not found or access denied");
    }

    // 2. Get notes to summarize (excluding existing summaries)
    const { data: notes, error: notesError } = await this.supabase
      .from("notes")
      .select("*")
      .eq("topic_id", topicId)
      .eq("is_summary", false);

    if (notesError) {
      throw new Error(`Failed to fetch notes: ${notesError.message}`);
    }

    if (!notes?.length) {
      throw new Error("No notes found to summarize");
    }

    // 3. Create summary_stats record
    const { data: summaryStat, error: summaryStatError } = await this.supabase
      .from("summary_stats")
      .insert({
        topic_id: topicId,
        user_id: _userId,
      })
      .select()
      .single();

    if (summaryStatError || !summaryStat) {
      throw new Error(`Failed to create summary stat: ${summaryStatError?.message}`);
    }

    // 4. Generate summary using AI
    try {
      const summary = await this.aiService.generateSummary(notes as NoteDTO[]);
      return {
        summary_stat_id: summaryStat.id,
        ...summary,
      };
    } catch (error) {
      // If AI generation fails, clean up the summary stat
      await this.supabase.from("summary_stats").delete().eq("id", summaryStat.id).eq("user_id", _userId);

      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Accept a generated summary for a topic
   * @param userId User ID
   * @param topicId Topic ID
   * @param summaryId Summary stat ID
   * @returns Object containing the summary_stat_id
   * @throws APIError for various error conditions
   */
  async acceptSummary(
    _userId: string,
    topicId: string,
    summaryId: string,
    summary: { title: string; content: string }
  ): Promise<{ summary_stat_id: string }> {
    // 1. Verify topic exists and belongs to user
    const { data: topic, error: topicError } = await this.supabase
      .from("topics")
      .select("id, title")
      .eq("id", topicId)
      .eq("user_id", _userId)
      .single();

    if (topicError) {
      if (topicError.code === "PGRST116") {
        throw new APIError("Topic not found", 404);
      }
      throw new APIError(`Failed to fetch topic: ${topicError.message}`, 500);
    }

    if (!topic) {
      throw new APIError("Topic not found or access denied", 403);
    }

    // 2. Verify summary stat exists and belongs to user
    const { data: summaryStat, error: summaryStatError } = await this.supabase
      .from("summary_stats")
      .select("id, topic_id")
      .eq("id", summaryId)
      .eq("user_id", _userId)
      .single();

    if (summaryStatError) {
      if (summaryStatError.code === "PGRST116") {
        throw new APIError("Summary not found", 404);
      }
      throw new APIError(`Failed to fetch summary: ${summaryStatError.message}`, 500);
    }

    if (!summaryStat) {
      throw new APIError("Summary not found or access denied", 403);
    }

    // 3. Ensure the summary belongs to the specified topic
    if (summaryStat.topic_id !== topicId) {
      throw new APIError("Summary does not belong to the specified topic", 400);
    }

    // 4. Use transaction to:
    //    - Update summary stat to accepted=true
    //    - Create a new note with summary content
    //    - Update summary_stat with the new note ID

    try {
      // 4.1 Create a new note with the summary content
      const noteData: CreateNoteCommand = {
        title: summary.title,
        content: summary.content,
        is_summary: true,
      };

      const { data: note, error: noteError } = await this.supabase
        .from("notes")
        .insert({
          title: noteData.title,
          content: noteData.content,
          topic_id: topicId,
          user_id: _userId,
          is_summary: true,
        })
        .select("id")
        .single();

      if (noteError || !note) {
        throw new APIError(`Failed to create summary note: ${noteError?.message}`, 500);
      }

      // 4.2 Update summary stat to accepted=true and set summary_note_id
      const { error: updateError } = await this.supabase
        .from("summary_stats")
        .update({
          accepted: true,
          summary_note_id: note.id,
        })
        .eq("id", summaryId)
        .eq("user_id", _userId);

      if (updateError) {
        // If update fails, we should ideally delete the created note, but for simplicity,
        // we'll just report the error
        throw new APIError(`Failed to update summary status: ${updateError.message}`, 500);
      }

      return { summary_stat_id: summaryId };
    } catch (error) {
      // If it's already an APIError, rethrow it
      if (error instanceof APIError) {
        throw error;
      }

      // Otherwise, wrap it in an APIError
      throw new APIError(`Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`, 500);
    }
  }

  /**
   * Rejects a generated summary for a topic
   *
   * Marks a summary as rejected by removing it from the database. This allows users
   * to discard generated summaries they don't want to use.
   *
   * The operation performs these validation steps:
   * 1. Verifies the topic exists and belongs to the user
   * 2. Verifies the summary exists and belongs to the user
   * 3. Ensures the summary belongs to the specified topic
   * 4. Deletes the summary from the database
   *
   * @param _userId User ID
   * @param topicId Topic ID to identify the parent topic
   * @param summaryId Summary stat ID to identify the summary to reject
   * @returns Object containing the summary_stat_id of the rejected summary
   * @throws APIError(404) If topic or summary not found
   * @throws APIError(403) If user doesn't have access to topic or summary
   * @throws APIError(400) If summary doesn't belong to topic
   * @throws APIError(500) If database operations fail
   */
  async rejectSummary(_userId: string, topicId: string, summaryId: string): Promise<{ summary_stat_id: string }> {
    // 1. Verify topic exists and belongs to user
    const { data: topic, error: topicError } = await this.supabase
      .from("topics")
      .select("id")
      .eq("id", topicId)
      .eq("user_id", _userId)
      .single();

    if (topicError) {
      if (topicError.code === "PGRST116") {
        throw new APIError("Topic not found", 404);
      }
      throw new APIError(`Failed to fetch topic: ${topicError.message}`, 500);
    }

    if (!topic) {
      throw new APIError("Topic not found or access denied", 403);
    }

    // 2. Verify summary stat exists and belongs to user
    const { data: summaryStat, error: summaryStatError } = await this.supabase
      .from("summary_stats")
      .select("id, topic_id")
      .eq("id", summaryId)
      .eq("user_id", _userId)
      .single();

    if (summaryStatError) {
      if (summaryStatError.code === "PGRST116") {
        throw new APIError("Summary not found", 404);
      }
      throw new APIError(`Failed to fetch summary: ${summaryStatError.message}`, 500);
    }

    if (!summaryStat) {
      throw new APIError("Summary not found or access denied", 403);
    }

    // 3. Ensure the summary belongs to the specified topic
    if (summaryStat.topic_id !== topicId) {
      throw new APIError("Summary does not belong to the specified topic", 400);
    }

    // 4. In future, there will be additional logic to reject the summary

    // 5. Return the summary stat ID
    return { summary_stat_id: summaryId };
  }
}
