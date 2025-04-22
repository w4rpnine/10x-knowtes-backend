import type { SupabaseClient } from "../../db/supabase.client";
import type { SummaryGenerationResponseDTO, SummaryStatDTO } from "../../types";
import { createNote } from "./notes.service";

/**
 * Generates a summary for a specific topic
 * Creates a new summary_stats record and a new note with is_summary=true
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user generating the summary
 * @param topicId - The ID of the topic to generate summary for
 * @returns Summary generation response or null if topic doesn't exist or user has no access
 */
export async function generateSummary(
  supabase: SupabaseClient,
  userId: string,
  topicId: string
): Promise<SummaryGenerationResponseDTO | null> {
  // Sprawdź czy temat istnieje i należy do użytkownika
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, title")
    .eq("id", topicId)
    .eq("user_id", userId)
    .single();

  if (topicError || !topic) {
    return null;
  }

  // Utwórz rekord w summary_stats
  const { data: summaryStats, error: statsError } = await supabase
    .from("summary_stats")
    .insert({
      user_id: userId,
      topic_id: topicId,
      accepted: false,
    })
    .select("*")
    .single();

  if (statsError) {
    throw statsError;
  }

  // Utwórz nową notatkę jako podsumowanie
  const note = await createNote(supabase, userId, topicId, {
    title: `Podsumowanie: ${topic.title || "Temat"}`,
    content: "Trwa generowanie podsumowania...",
    is_summary: true,
  });

  if (!note) {
    throw new Error("Nie udało się utworzyć notatki podsumowującej");
  }

  // Powiąż notatkę z rekordem summary_stats
  const { error: updateError } = await supabase
    .from("summary_stats")
    .update({ summary_note_id: note.id })
    .eq("id", summaryStats.id);

  if (updateError) {
    throw updateError;
  }

  // Zwróć informacje o utworzonym podsumowaniu
  return {
    summary_stat_id: summaryStats.id,
    topic_id: topicId,
    note_id: note.id,
    status: "processing",
  };
}

/**
 * Accepts a generated summary.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user accepting the summary
 * @param summaryId - The ID of the summary to accept
 * @returns The updated summary stat record or null if not found, not owned by user, or not a summary note
 */
export async function acceptSummary(
  supabase: SupabaseClient,
  userId: string,
  summaryId: string
): Promise<SummaryStatDTO | null> {
  // Check if summary exists, belongs to user, and is linked to a summary note
  const { data: existingSummary, error: fetchError } = await supabase
    .from("summary_stats")
    .select(
      `
      *,
      notes:summary_note_id (
        is_summary
      )
    `
    )
    .eq("id", summaryId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingSummary) {
    return null;
  }

  // Verify that this is a summary note
  if (!existingSummary.notes?.is_summary) {
    return null;
  }

  // Update record, setting accepted = true
  const { data: updatedSummary, error: updateError } = await supabase
    .from("summary_stats")
    .update({ accepted: true })
    .eq("id", summaryId)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  return updatedSummary;
}
